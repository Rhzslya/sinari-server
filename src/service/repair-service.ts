import {
  Brand,
  ServiceLogAction,
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
  toPublicServiceResponse,
  toServiceResponse,
  type CreateServiceRequest,
  type DeleteServiceRequest,
  type DetailedServiceRequest,
  type PublicServiceResponse,
  type RestoreServiceRequest,
  type SearchServiceRequest,
  type ServiceResponse,
  type TrackPublicServiceRequest,
  type UpdateServiceRequest,
} from "../model/repair-model";
import { CheckExist } from "../utils/check-exist";
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
            action: ServiceLogAction.CREATED,
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

  static async get(
    user: User,
    request: DetailedServiceRequest,
  ): Promise<ServiceResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const service = await CheckExist.checkServiceExists({ id: request.id });

    return toServiceResponse(service);
  }

  static async remove(
    user: User,
    request: DeleteServiceRequest,
  ): Promise<boolean> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const service = await CheckExist.checkServiceExists({ id: request.id });

    const allowedStatusToDelete: ServiceStatus[] = [
      ServiceStatus.CANCELLED,
      ServiceStatus.TAKEN,
    ];

    if (!allowedStatusToDelete.includes(service.status as ServiceStatus)) {
      throw new ResponseError(
        400,
        `Cannot delete active service. Current status is ${service.status}. Please CANCEL it or mark as TAKEN first.`,
      );
    }

    await prismaClient.service.update({
      where: { id: request.id },
      data: {
        deleted_at: new Date(),
      },
    });

    await prismaClient.serviceLog.create({
      data: {
        service_id: request.id,
        user_id: user.id,
        action: ServiceLogAction.DELETED,
        description: "Service ticket moved to trash (soft delete)",
      },
    });

    return true;
  }

  static async restore(
    user: User,
    request: RestoreServiceRequest,
  ): Promise<ServiceResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const restoreRequest = Validation.validate(
      RepairValidation.RESTORE,
      request,
    );

    const serviceInTrash = await prismaClient.service.findFirst({
      where: {
        id: restoreRequest.id,
        deleted_at: { not: null },
      },
    });

    if (!serviceInTrash) {
      throw new ResponseError(
        404,
        "Service not found in trash bin. It might be active or permanently deleted.",
      );
    }

    const [restoredService, _log] = await prismaClient.$transaction([
      prismaClient.service.update({
        where: { id: restoreRequest.id },
        data: {
          deleted_at: null,
        },
        include: {
          service_list: true,
          technician: true,
        },
      }),

      prismaClient.serviceLog.create({
        data: {
          service_id: restoreRequest.id,
          user_id: user.id,
          action: ServiceLogAction.RESTORED,
          description: "Service restored from trash bin",
        },
      }),
    ]);

    return toServiceResponse(restoredService);
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
      deleted_at: searchRequest.is_deleted ? { not: null } : null,
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

  static async trackPublic(
    request: TrackPublicServiceRequest,
  ): Promise<PublicServiceResponse> {
    const service = await prismaClient.service.findFirst({
      where: {
        OR: [
          { tracking_token: request.identifier },
          { service_id: request.identifier },
        ],
        deleted_at: null,
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
    const oldService = await CheckExist.checkServiceExists({
      id: updateRequest.id,
    });

    if (oldService.deleted_at !== null) {
      throw new ResponseError(
        400,
        "Cannot update a deleted service. Please restore it first.",
      );
    }

    const allowRollback = this.checkGracePeriod(oldService);

    this.validateLockingRules(
      oldService,
      updateRequest as UpdateServiceRequest,
      allowRollback,
    );
    this.validateStatusTransition(
      oldService,
      updateRequest as UpdateServiceRequest,
      allowRollback,
    );
    await this.validateTechnician(updateRequest.technician_id);

    const newGracePeriodStart = this.calculateNewGracePeriod(
      oldService,
      updateRequest.status as ServiceStatus,
    );
    const pricing = this.calculatePricing(
      oldService,
      updateRequest as UpdateServiceRequest,
    );

    const { logMessages, mainAction } = this.generateAuditLogs(
      oldService,
      updateRequest as UpdateServiceRequest,
      pricing,
    );

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
      grace_period_start: newGracePeriodStart,
      discount: pricing.discount,
      down_payment: pricing.downPayment,
      total_price: pricing.totalPrice,
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

  private static checkGracePeriod(oldService: Service): boolean {
    if (!oldService.grace_period_start) return false;

    const lockTime = new Date(oldService.grace_period_start).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (now - lockTime) / 1000 / 60;

    return diffInMinutes <= 15;
  }

  private static calculateNewGracePeriod(
    oldService: Service,
    newStatus?: ServiceStatus,
  ): Date | null | undefined {
    if (!newStatus || newStatus === oldService.status) {
      return oldService.grace_period_start;
    }

    const finalStatuses: ServiceStatus[] = [
      ServiceStatus.FINISHED,
      ServiceStatus.CANCELLED,
    ] as ServiceStatus[];

    const isOldFinal = finalStatuses.includes(
      oldService.status as ServiceStatus,
    );
    const isNewFinal = finalStatuses.includes(newStatus);

    if (!isOldFinal && isNewFinal) return new Date();
    if (isOldFinal && !isNewFinal) return null;

    return oldService.grace_period_start;
  }
  private static validateLockingRules(
    oldService: Service & { service_list: ServiceItem[] },
    req: UpdateServiceRequest,
    allowRollback: boolean,
  ) {
    // 1. Cek Completely Final (Locked Total)
    const isCompletelyFinal =
      oldService.status === ServiceStatus.CANCELLED ||
      (oldService.status === ServiceStatus.TAKEN && !allowRollback);

    if (isCompletelyFinal) {
      const isTryingToChangeAnything =
        (req.customer_name && req.customer_name !== oldService.customer_name) ||
        (req.phone_number &&
          formatPhoneNumber(req.phone_number) !== oldService.phone_number) ||
        (req.brand && req.brand !== oldService.brand) ||
        (req.model && req.model !== oldService.model) ||
        (req.status && req.status !== oldService.status) ||
        (req.description !== undefined &&
          req.description !== oldService.description) ||
        (req.technician_note !== undefined &&
          req.technician_note !== oldService.technician_note);

      if (isTryingToChangeAnything && !allowRollback) {
        throw new ResponseError(
          400,
          `Fraud Prevention: Service is already ${oldService.status}. No changes allowed.`,
        );
      }
    }

    const lockedStatuses: ServiceStatus[] = [
      ServiceStatus.FINISHED,
      ServiceStatus.CANCELLED,
      ServiceStatus.TAKEN,
    ];
    const isCurrentlyLocked =
      lockedStatuses.includes(oldService.status as ServiceStatus) &&
      !allowRollback;

    if (isCurrentlyLocked) {
      let isTryingToChangeMoney = false;
      if (
        (req.down_payment !== undefined &&
          req.down_payment !== oldService.down_payment) ||
        (req.discount !== undefined && req.discount !== oldService.discount)
      ) {
        isTryingToChangeMoney = true;
      }

      if (req.service_list) {
        const oldSub = oldService.service_list.reduce((a, b) => a + b.price, 0);
        const newSub = req.service_list.reduce((a, b) => a + b.price, 0);
        if (
          oldSub !== newSub ||
          oldService.service_list.length !== req.service_list.length
        ) {
          isTryingToChangeMoney = true;
        }
      }

      const isTechnicianChanged =
        req.technician_id && req.technician_id !== oldService.technician_id;

      if (isTryingToChangeMoney || isTechnicianChanged) {
        throw new ResponseError(
          400,
          "Fraud Prevention: Cannot change technician or financials on a locked service.",
        );
      }
    }
  }

  private static validateStatusTransition(
    oldService: Service,
    req: UpdateServiceRequest,
    allowRollback: boolean,
  ) {
    if (!req.status || req.status === oldService.status) return;

    const newStatus = req.status as ServiceStatus;

    const isActiveStatus =
      newStatus === ServiceStatus.PENDING ||
      newStatus === ServiceStatus.PROCESS;

    if (oldService.status === ServiceStatus.TAKEN) {
      if (isActiveStatus) {
        throw new ResponseError(
          400,
          "Fraud Prevention: Service already taken (Cannot Undo)",
        );
      }
    }

    const isOldFinal =
      oldService.status === ServiceStatus.FINISHED ||
      oldService.status === ServiceStatus.CANCELLED;

    if (isOldFinal && !allowRollback) {
      if (newStatus === ServiceStatus.TAKEN) {
        return;
      }
      throw new ResponseError(
        400,
        `Fraud Prevention: Service is already ${oldService.status} (Grace period expired). Status locked (can only change to TAKEN).`,
      );
    }
  }

  private static async validateTechnician(techId?: number) {
    if (!techId) return null;

    const technician = await prismaClient.technician.findFirst({
      where: {
        id: techId,
        deleted_at: null,
      },
    });

    if (!technician) {
      throw new ResponseError(
        404,
        "Invalid technician ID or technician has been deleted",
      );
    }

    if (!technician.is_active) {
      throw new ResponseError(400, "Cannot assign to inactive technician");
    }

    return technician;
  }

  private static calculatePricing(
    oldService: Service & { service_list: ServiceItem[] },
    req: UpdateServiceRequest,
  ) {
    const currentItems = req.service_list ?? oldService.service_list;
    const subTotal = currentItems.reduce(
      (total, item) => total + item.price,
      0,
    );
    const discount = req.discount ?? oldService.discount;
    const downPayment = req.down_payment ?? oldService.down_payment;

    const discountAmount = (subTotal * discount) / 100;
    const totalPrice = subTotal - discountAmount - downPayment;

    if (totalPrice < 0) {
      throw new ResponseError(
        400,
        "Total price cannot be negative. Check Down Payment.",
      );
    }

    return {
      subTotal,
      discount,
      downPayment,
      totalPrice,
      oldGrandTotal: oldService.total_price,
    };
  }

  private static generateAuditLogs(
    oldService: Service & { service_list: ServiceItem[] },
    req: UpdateServiceRequest,
    pricing: { totalPrice: number; oldGrandTotal: number },
  ) {
    let logMessages: string[] = [];
    let mainAction: ServiceLogAction = ServiceLogAction.UPDATE_INFO;

    // Status
    if (req.status && req.status !== oldService.status) {
      logMessages.push(`Status: ${oldService.status} -> ${req.status}`);
      mainAction = ServiceLogAction.UPDATE_STATUS;
    }
    // Money
    if (
      req.down_payment !== undefined &&
      req.down_payment !== oldService.down_payment
    ) {
      logMessages.push(
        `DP: ${fmt(oldService.down_payment)} -> ${fmt(req.down_payment)}`,
      );
      mainAction = ServiceLogAction.UPDATE_DOWN_PAYMENT;
    }
    if (req.discount !== undefined && req.discount !== oldService.discount) {
      logMessages.push(`Discount: ${oldService.discount}% -> ${req.discount}%`);
      mainAction = ServiceLogAction.UPDATE_DISCOUNT;
    }
    // Technician
    if (req.technician_id && req.technician_id !== oldService.technician_id) {
      logMessages.push(`Technician changed`);
      mainAction = ServiceLogAction.UPDATE_TECHNICIAN;
    }

    // Service List Diffing
    if (req.service_list) {
      let oldList = [...oldService.service_list];
      let newList = [...req.service_list];
      let listChanged = false;

      // Filter exact match
      for (let i = newList.length - 1; i >= 0; i--) {
        const idx = oldList.findIndex(
          (o) =>
            o.name.toLowerCase() === newList[i].name.toLowerCase() &&
            o.price === newList[i].price,
        );
        if (idx !== -1) {
          oldList.splice(idx, 1);
          newList.splice(i, 1);
        }
      }
      // Name match (Price change)
      for (let i = newList.length - 1; i >= 0; i--) {
        const idx = oldList.findIndex(
          (o) => o.name.toLowerCase() === newList[i].name.toLowerCase(),
        );
        if (idx !== -1) {
          logMessages.push(
            `"${newList[i].name}" price: ${fmt(oldList[idx].price)} -> ${fmt(newList[i].price)}`,
          );
          listChanged = true;
          oldList.splice(idx, 1);
          newList.splice(i, 1);
        }
      }
      // Added/Removed
      newList.forEach((item) => {
        logMessages.push(`Added: "${item.name}"`);
        listChanged = true;
      });
      oldList.forEach((item) => {
        logMessages.push(`Removed: "${item.name}"`);
        listChanged = true;
      });

      if (listChanged) mainAction = ServiceLogAction.UPDATE_SERVICE_LIST;
    }

    // Total Price Check
    if (pricing.oldGrandTotal !== pricing.totalPrice) {
      logMessages.push(
        `Bill: ${fmt(pricing.oldGrandTotal)} -> ${fmt(pricing.totalPrice)}`,
      );
      if (mainAction === ServiceLogAction.UPDATE_INFO)
        mainAction = ServiceLogAction.UPDATE_FINANCIALS;
    }

    return { logMessages, mainAction };
  }
}
