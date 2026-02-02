import {
  Brand,
  ServiceStatus,
  type Prisma,
  type Service,
  type ServiceItem,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import type { Pageable } from "../model/page-model";
import {
  toPublicServiceResponse,
  toServiceResponse,
  type CreateServiceRequest,
  type PublicServiceResponse,
  type SearchServiceRequest,
  type ServiceResponse,
  type UpdateServiceRequest,
} from "../model/repair-model";
import { generateServiceId } from "../utils/id-generator";
import { RepairValidation } from "../validation/repair-validation";
import { Validation } from "../validation/validation";
import { v4 as uuid } from "uuid";

export class ServicesDataService {
  static async create(
    user: User,
    request: CreateServiceRequest,
  ): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(RepairValidation.CREATE, request);

    const subTotal = createRequest.service_list.reduce(
      (total, item) => total + item.price,
      0,
    );

    const discountAmount = (subTotal * (createRequest.discount || 0)) / 100;
    const totalPrice = subTotal - discountAmount;

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
        phone_number: createRequest.phone_number,
        description: createRequest.description,
        technician_note: createRequest.technician_note,
        status: ServiceStatus.PENDING,
        service_list: {
          create: createRequest.service_list,
        },
        discount: createRequest.discount || 0,
        total_price: totalPrice,
        tracking_token: trackingToken,
      },
      include: {
        service_list: true,
      },
    });

    const trackingUrl = `https://sinari.com/services/track?token=${service.tracking_token}`;
    const message = `Halo ${service.customer_name} Your service has been created. Please track it here: ${trackingUrl}`;

    // await WhatsappService.sendMessage(service.phone_number, message);
    console.log("SENDING WA TO", service.phone_number, message);

    return toServiceResponse(service);
  }

  static async checkServiceExists(
    id: number,
  ): Promise<Service & { service_list: ServiceItem[] }> {
    const service = await prismaClient.service.findUnique({
      where: {
        id: id,
      },
      include: {
        service_list: true,
      },
    });

    if (!service) {
      throw new ResponseError(404, "Service not found");
    }

    return service;
  }

  static async get(user: User, id: number): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const service = await this.checkServiceExists(id);

    return toServiceResponse(service);
  }

  static async getByToken(token: string): Promise<PublicServiceResponse> {
    const service = await prismaClient.service.findUnique({
      where: {
        tracking_token: token,
      },
      include: {
        service_list: true,
      },
    });

    if (!service) {
      throw new ResponseError(404, "Service not found");
    }

    return toPublicServiceResponse(service);
  }

  static async update(
    user: User,
    request: UpdateServiceRequest,
  ): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const oldService = await this.checkServiceExists(request.id);

    const updateRequest = Validation.validate(RepairValidation.UPDATE, request);

    let currentItems: { price: number }[] = oldService.service_list;

    if (updateRequest.service_list) {
      currentItems = updateRequest.service_list;
    }

    const subTotal = currentItems.reduce(
      (total, item) => total + item.price,
      0,
    );

    const currentDiscount = updateRequest.discount ?? oldService.discount;

    const discountAmount = (subTotal * currentDiscount) / 100;

    const totalPrice = subTotal - discountAmount;

    const updateData: Prisma.ServiceUpdateInput = {
      brand: updateRequest.brand,
      model: updateRequest.model,
      customer_name: updateRequest.customer_name,
      phone_number: updateRequest.phone_number,
      description: updateRequest.description,
      technician_note: updateRequest.technician_note,
      status: updateRequest.status as ServiceStatus,
      discount: currentDiscount,
      total_price: totalPrice,
    };

    if (updateRequest.service_list) {
      updateData.service_list = {
        deleteMany: {},
        create: updateRequest.service_list,
      };
    }

    const service = await prismaClient.service.update({
      where: {
        id: updateRequest.id,
      },
      data: updateData,
      include: {
        service_list: true,
      },
    });

    if (updateRequest.status && updateRequest.status !== oldService.status) {
      const trackingUrl = `https://sinari.com/services/track?token=${service.tracking_token}`;
      const message = `Halo ${service.customer_name} Your service has been updated. Please track it here: ${trackingUrl}`;

      // await WhatsappService.sendMessage(service.phone_number, message);
      console.log("SENDING WA TO", service.phone_number, message);
    }

    return toServiceResponse(service);
  }

  static async remove(user: User, id: number): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const service = await this.checkServiceExists(id);

    await prismaClient.service.delete({
      where: {
        id: id,
      },
    });

    return toServiceResponse(service);
  }

  static async search(
    user: User,
    request: SearchServiceRequest,
  ): Promise<Pageable<ServiceResponse>> {
    if (user.role !== "admin") {
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
        ],
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

  static async searchByServiceId(
    serviceId: string,
  ): Promise<PublicServiceResponse> {
    const normalizeServiceId = serviceId.toUpperCase().trim();

    const service = await prismaClient.service.findUnique({
      where: {
        service_id: normalizeServiceId,
      },
      include: {
        service_list: true,
      },
    });

    if (!service) {
      throw new ResponseError(404, "Service not found");
    }

    return toPublicServiceResponse(service);
  }
}
