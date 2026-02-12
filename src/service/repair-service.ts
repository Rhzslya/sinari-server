import {
  Brand,
  ServiceStatus,
  UserRole,
  type Prisma,
  type Service,
  type ServiceItem,
  type Technician,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import type { Pageable } from "../model/page-model";
import {
  toServiceLogResponse,
  type ServiceLogResponse,
} from "../model/repair-logs-model";
import {
  toPublicServiceResponse,
  toServiceResponse,
  type CreateServiceRequest,
  type PublicServiceResponse,
  type SearchServiceRequest,
  type ServiceResponse,
  type UpdateServiceRequest,
} from "../model/repair-model";
import { formatPhoneNumber } from "../utils/format-phone-number";
import { fmt } from "../utils/format-rupiah";
import { generateServiceId } from "../utils/id-generator";
import { RepairValidation } from "../validation/repair-validation";
import { Validation } from "../validation/validation";
import { v4 as uuid } from "uuid";

export class ServicesDataService {
  static async create(
    user: User,
    request: CreateServiceRequest,
  ): Promise<ServiceResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(RepairValidation.CREATE, request);

    if (createRequest.technician_id) {
      const technician = await prismaClient.technician.findUnique({
        where: {
          id: createRequest.technician_id,
        },
      });

      if (!technician) {
        throw new ResponseError(400, "Invalid technician ID");
      }

      if (!technician.is_active) {
        throw new ResponseError(400, "Cannot assign to inactive technician");
      }
    }

    const subTotal = createRequest.service_list.reduce(
      (total, item) => total + item.price,
      0,
    );

    const discountAmount = (subTotal * (createRequest.discount || 0)) / 100;
    const downPayment = createRequest.down_payment || 0;
    const totalPrice = subTotal - discountAmount - downPayment;

    if (totalPrice < 0) {
      throw new ResponseError(
        400,
        "Down Payment cannot exceed the total price",
      );
    }

    const trackingToken = uuid();

    let serviceId = generateServiceId();
    let isUnique = false;

    while (!isUnique) {
      const existing = await prismaClient.service.findUnique({
        where: { service_id: serviceId },
      });
      if (!existing) {
        isUnique = true;
      } else {
        serviceId = generateServiceId();
      }
    }

    const service = await prismaClient.service.create({
      data: {
        service_id: serviceId,
        brand: createRequest.brand,
        model: createRequest.model,
        customer_name: createRequest.customer_name,
        phone_number: formatPhoneNumber(createRequest.phone_number),
        description: createRequest.description,
        technician_note: createRequest.technician_note,
        status: ServiceStatus.PENDING,
        service_list: {
          create: createRequest.service_list,
        },
        discount: createRequest.discount || 0,
        down_payment: downPayment,
        total_price: totalPrice,
        tracking_token: trackingToken,
        technician: {
          connect: {
            id: createRequest.technician_id,
          },
        },
        service_logs: {
          create: {
            user_id: user.id,
            action: "CREATED",
            description: `Service ticket created and assigned to technician ID ${createRequest.technician_id}, Total Bill : ${fmt(totalPrice)} `,
          },
        },
      },

      include: {
        service_list: true,
        technician: true,
      },
    });

    const trackingUrl = `http://localhost:5173/services/track/${service.tracking_token}`;
    const message = `Halo ${service.customer_name} Your service has been created. Please track it here: ${trackingUrl}`;

    // await WhatsappService.sendMessage(service.phone_number, message);
    console.log("SENDING WA TO", service.phone_number, message);

    return toServiceResponse(service);
  }

  static async checkServiceExists(
    id: number,
  ): Promise<
    Service & { service_list: ServiceItem[]; technician: Technician }
  > {
    const service = await prismaClient.service.findUnique({
      where: {
        id: id,
      },
      include: {
        service_list: true,
        technician: true,
      },
    });

    if (!service) {
      throw new ResponseError(404, "Service not found");
    }

    return service;
  }

  static async get(user: User, id: number): Promise<ServiceResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const service = await this.checkServiceExists(id);

    return toServiceResponse(service);
  }

  static async update(
    user: User,
    request: UpdateServiceRequest,
  ): Promise<{
    data: ServiceResponse;
    meta: { wa_status: string; message?: string };
  }> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }
    const updateRequest = Validation.validate(RepairValidation.UPDATE, request);

    const oldService = await this.checkServiceExists(updateRequest.id);

    const lockedStatuses: ServiceStatus[] = [
      ServiceStatus.FINISHED,
      ServiceStatus.CANCELLED,
      ServiceStatus.TAKEN,
    ];

    const isCurrentlyLocked = lockedStatuses.includes(
      oldService.status as ServiceStatus,
    );

    const isCompletelyFinal =
      oldService.status === ServiceStatus.CANCELLED ||
      oldService.status === ServiceStatus.TAKEN;

    if (isCompletelyFinal) {
      const isTryingToChangeAnything =
        (updateRequest.customer_name &&
          updateRequest.customer_name !== oldService.customer_name) ||
        (updateRequest.phone_number &&
          formatPhoneNumber(updateRequest.phone_number) !==
            oldService.phone_number) ||
        (updateRequest.brand && updateRequest.brand !== oldService.brand) ||
        (updateRequest.model && updateRequest.model !== oldService.model) ||
        (updateRequest.status && updateRequest.status !== oldService.status) ||
        (updateRequest.description !== undefined &&
          updateRequest.description !== oldService.description) ||
        (updateRequest.technician_note !== undefined &&
          updateRequest.technician_note !== oldService.technician_note);

      if (isTryingToChangeAnything) {
        throw new ResponseError(
          400,
          `Fraud Prevention: Service is already ${oldService.status}. No further changes are allowed.`,
        );
      }
    }

    if (updateRequest.status && updateRequest.status !== oldService.status) {
      const newStatus = updateRequest.status as ServiceStatus;

      if (
        oldService.status === ServiceStatus.TAKEN &&
        (newStatus === ServiceStatus.PENDING ||
          newStatus === ServiceStatus.PROCESS)
      ) {
        throw new ResponseError(400, "Fraud Prevention: Service already taken");
      }
      if (
        oldService.status === ServiceStatus.FINISHED &&
        (newStatus === ServiceStatus.PENDING ||
          newStatus === ServiceStatus.PROCESS)
      ) {
        throw new ResponseError(
          400,
          "Fraud Prevention: Service already finished",
        );
      }
      if (
        oldService.status === ServiceStatus.CANCELLED &&
        (newStatus === ServiceStatus.PENDING ||
          newStatus === ServiceStatus.PROCESS)
      ) {
        throw new ResponseError(
          400,
          "Fraud Prevention: Service already cancelled",
        );
      }
    }

    if (isCurrentlyLocked) {
      let isTryingToChangeMoney = false;

      if (
        updateRequest.down_payment !== undefined &&
        updateRequest.down_payment !== oldService.down_payment
      ) {
        isTryingToChangeMoney = true;
      }

      if (
        updateRequest.discount !== undefined &&
        updateRequest.discount !== oldService.discount
      ) {
        isTryingToChangeMoney = true;
      }

      if (updateRequest.service_list) {
        const oldSubTotal = oldService.service_list.reduce(
          (acc, item) => acc + item.price,
          0,
        );
        const newSubTotal = updateRequest.service_list.reduce(
          (acc, item) => acc + item.price,
          0,
        );

        if (
          oldSubTotal !== newSubTotal ||
          oldService.service_list.length !== updateRequest.service_list.length
        ) {
          isTryingToChangeMoney = true;
        }
      }

      const isTryingToChangeTechnician =
        updateRequest.technician_id &&
        updateRequest.technician_id !== oldService.technician_id;

      if (isTryingToChangeMoney || isTryingToChangeTechnician) {
        throw new ResponseError(
          400,
          "Fraud Prevention: Cannot change technician, items, or money on a locked service.",
        );
      }
    }

    if (updateRequest.technician_id) {
      const technician = await prismaClient.technician.findUnique({
        where: {
          id: updateRequest.technician_id,
        },
      });

      if (!technician) {
        throw new ResponseError(400, "Invalid technician ID");
      }

      if (!technician.is_active) {
        throw new ResponseError(400, "Cannot assign to inactive technician");
      }
    }

    let currentItems: { price: number }[] = oldService.service_list;

    if (updateRequest.service_list) {
      currentItems = updateRequest.service_list;
    }

    const subTotal = currentItems.reduce(
      (total, item) => total + item.price,
      0,
    );

    const currentDiscount = updateRequest.discount ?? oldService.discount;
    const currentDownPayment =
      updateRequest.down_payment ?? oldService.down_payment;

    const discountAmount = (subTotal * currentDiscount) / 100;

    const totalPrice = subTotal - discountAmount - currentDownPayment;

    if (totalPrice < 0) {
      throw new ResponseError(
        400,
        "Calculated total price cannot be negative. Check Down Payment amount.",
      );
    }

    let logMessages: string[] = [];
    let mainAction = "UPDATE_INFO";

    const oldSubTotal = oldService.service_list.reduce(
      (acc, item) => acc + item.price,
      0,
    );
    const oldDiscAmount = (oldSubTotal * oldService.discount) / 100;
    const oldGrandTotal = oldSubTotal - oldDiscAmount - oldService.down_payment;

    if (updateRequest.status && updateRequest.status !== oldService.status) {
      logMessages.push(
        `Status changed from ${oldService.status} to ${updateRequest.status}`,
      );
      mainAction = "UPDATE_STATUS";
    }

    if (
      updateRequest.down_payment !== undefined &&
      updateRequest.down_payment !== oldService.down_payment
    ) {
      logMessages.push(
        `Down Payment changed from ${fmt(oldService.down_payment)} to ${fmt(updateRequest.down_payment)}`,
      );
      mainAction = "UPDATE_DOWN_PAYMENT";
    }

    if (
      updateRequest.discount !== undefined &&
      updateRequest.discount !== oldService.discount
    ) {
      logMessages.push(
        `Discount changed from ${oldService.discount}% to ${updateRequest.discount}%`,
      );
      mainAction = "UPDATE_DISCOUNT";
    }

    if (
      updateRequest.technician_id &&
      updateRequest.technician_id !== oldService.technician_id
    ) {
      logMessages.push(
        `Assigned technician with ID${updateRequest.technician_id}`,
      );
      mainAction = "UPDATE_TECHNICIAN";
    }

    if (updateRequest.service_list) {
      let remainingOldItems = [...oldService.service_list];
      let remainingNewItems = [...updateRequest.service_list];

      let hasListChanged = false;
      for (let i = remainingNewItems.length - 1; i >= 0; i--) {
        const newItem = remainingNewItems[i];
        const exactMatchIndex = remainingOldItems.findIndex(
          (old) =>
            old.name.toLowerCase() === newItem.name.toLowerCase() &&
            old.price === newItem.price,
        );

        if (exactMatchIndex !== -1) {
          remainingOldItems.splice(exactMatchIndex, 1);
          remainingNewItems.splice(i, 1);
        }
      }

      for (let i = remainingNewItems.length - 1; i >= 0; i--) {
        const newItem = remainingNewItems[i];
        const nameMatchIndex = remainingOldItems.findIndex(
          (old) => old.name.toLowerCase() === newItem.name.toLowerCase(),
        );

        if (nameMatchIndex !== -1) {
          const oldItem = remainingOldItems[nameMatchIndex];

          logMessages.push(
            `Price for "${newItem.name}" updated from ${fmt(oldItem.price)} to ${fmt(newItem.price)}`,
          );
          hasListChanged = true;

          remainingOldItems.splice(nameMatchIndex, 1);
          remainingNewItems.splice(i, 1);
        }
      }

      for (const newItem of remainingNewItems) {
        logMessages.push(
          `Added item: "${newItem.name}" (+${fmt(newItem.price)})`,
        );
        hasListChanged = true;
      }
      for (const oldItem of remainingOldItems) {
        logMessages.push(
          `Removed item: "${oldItem.name}" (-${fmt(oldItem.price)})`,
        );
        hasListChanged = true;
      }
      if (hasListChanged) {
        mainAction = "UPDATE_SERVICE_LIST";
      }
    }
    if (oldGrandTotal !== totalPrice) {
      logMessages.push(
        `Total Bill updated from ${fmt(oldGrandTotal)} to ${fmt(totalPrice)}`,
      );

      if (mainAction === "UPDATE_INFO") {
        mainAction = "UPDATE_FINANCIALS";
      }
    }

    const updateData: Prisma.ServiceUpdateInput = {
      brand: updateRequest.brand,
      model: updateRequest.model,
      customer_name: updateRequest.customer_name,
      phone_number: updateRequest.phone_number
        ? formatPhoneNumber(updateRequest.phone_number)
        : undefined,
      description: updateRequest.description,
      technician_note: updateRequest.technician_note,
      status: updateRequest.status as ServiceStatus,
      discount: currentDiscount,
      down_payment: currentDownPayment,
      total_price: totalPrice,
    };

    if (updateRequest.technician_id) {
      updateData.technician = {
        connect: {
          id: updateRequest.technician_id,
        },
      };
    }

    if (updateRequest.service_list) {
      updateData.service_list = {
        deleteMany: {},
        create: updateRequest.service_list,
      };
    }

    let service;

    if (logMessages.length > 0) {
      const finalLogDescription = logMessages.join(", ");

      const [updatedService, _newLog] = await prismaClient.$transaction([
        prismaClient.service.update({
          where: { id: updateRequest.id },
          data: updateData,
          include: { service_list: true, technician: true },
        }),
        prismaClient.serviceLog.create({
          data: {
            service_id: updateRequest.id,
            user_id: user.id,
            action: mainAction,
            description: finalLogDescription,
          },
        }),
      ]);
      service = updatedService;
    } else {
      service = await prismaClient.service.update({
        where: {
          id: updateRequest.id,
        },
        data: updateData,
        include: {
          service_list: true,
          technician: true,
        },
      });
    }

    let whatsappMeta: {
      wa_status: "skipped" | "sent" | "failed";
      message?: string;
    } = {
      wa_status: "skipped",
      message: "",
    };
    if (updateRequest.status && updateRequest.status !== oldService.status) {
      const trackingUrl = `https://sinari.com/services/track?token=${service.tracking_token}`;
      const message = `Halo ${service.customer_name}...\nLink: ${trackingUrl}`;

      // const whatsappResult = await WhatsappService.sendMessage(
      //   service.phone_number,
      //   message,
      // );

      // if (whatsappResult.success) {
      //   whatsappMeta = {
      //     wa_status: "sent",
      //     message: "Notifikasi WA berhasil terkirim",
      //   };
      // } else {
      //   whatsappMeta = {
      //     wa_status: "failed",
      //     message: whatsappResult.error || "Unknown error",
      //   };
      // }

      console.log("SENDING WA TO", service.phone_number, message);
    }

    return {
      data: toServiceResponse(service),
      meta: whatsappMeta,
    };
  }

  static async getLogs(
    user: User,
    serviceId: number,
  ): Promise<ServiceLogResponse[]> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    await this.checkServiceExists(serviceId);

    const logs = await prismaClient.serviceLog.findMany({
      where: {
        service_id: serviceId,
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return logs.map(toServiceLogResponse);
  }

  static async remove(user: User, id: number): Promise<boolean> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    await this.checkServiceExists(id);

    await prismaClient.service.delete({
      where: {
        id: id,
      },
    });

    return true;
  }

  static async search(
    user: User,
    request: SearchServiceRequest,
  ): Promise<Pageable<ServiceResponse>> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const searchRequest = Validation.validate(RepairValidation.SEARCH, request);

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const andFilters: Prisma.ServiceWhereInput[] = [];

    if (searchRequest.brand) {
      andFilters.push({ brand: searchRequest.brand as Brand });
    }

    if (searchRequest.model) {
      andFilters.push({
        model: {
          contains: searchRequest.model,
        },
      });
    }

    if (searchRequest.customer_name) {
      andFilters.push({
        OR: [
          { customer_name: { contains: searchRequest.customer_name } },
          { model: { contains: searchRequest.customer_name } },
          {
            technician: {
              name: { contains: searchRequest.customer_name },
            },
          },
        ],
      });
    }

    if (searchRequest.phone_number) {
      andFilters.push({
        phone_number: {
          contains: searchRequest.phone_number,
        },
      });
    }

    if (searchRequest.status) {
      andFilters.push({
        status: searchRequest.status as ServiceStatus,
      });
    }

    if (searchRequest.min_price || searchRequest.max_price) {
      andFilters.push({
        total_price: {
          gte: searchRequest.min_price,
          lte: searchRequest.max_price,
        },
      });
    }

    const whereClause: Prisma.ServiceWhereInput = {
      AND: andFilters,
    };

    const services = await prismaClient.service.findMany({
      where: whereClause,
      take: searchRequest.size,
      skip: skip,
      include: {
        service_list: true,
        technician: true,
      },
      orderBy: {
        [searchRequest.sort_by || "created_at"]:
          searchRequest.sort_order || "desc",
      },
    });

    const total = await prismaClient.service.count({
      where: whereClause,
    });

    return {
      data: services.map((service) => toServiceResponse(service)),
      paging: {
        size: searchRequest.size,
        current_page: searchRequest.page,
        total_page: Math.ceil(total / searchRequest.size),
      },
    };
  }

  static async trackPublic(identifier: string): Promise<PublicServiceResponse> {
    const service = await prismaClient.service.findFirst({
      where: {
        OR: [{ tracking_token: identifier }, { service_id: identifier }],
      },
      include: {
        service_list: true,
        technician: true,
      },
    });

    if (!service) {
      throw new ResponseError(
        404,
        "Service not found. Please check your Token or Service ID.",
      );
    }

    return toPublicServiceResponse(service);
  }
}
