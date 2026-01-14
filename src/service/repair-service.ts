import type {
  Prisma,
  Service,
  ServiceItem,
  User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import {
  toPublicServiceResponse,
  toServiceResponse,
  type CreateServiceRequest,
  type PublicServiceResponse,
  type ServiceResponse,
  type UpdateServiceRequest,
} from "../model/repair-model";
import { RepairValidation } from "../validation/repair-validation";
import { Validation } from "../validation/validation";
import { v4 as uuid } from "uuid";

export class ServicesDataService {
  static async create(
    user: User,
    request: CreateServiceRequest
  ): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(RepairValidation.CREATE, request);

    const subTotal = createRequest.service_list.reduce(
      (total, item) => total + item.price,
      0
    );

    const discountAmount = (subTotal * (createRequest.discount || 0)) / 100;
    const totalPrice = subTotal - discountAmount;

    const trackingToken = uuid();

    const service = await prismaClient.service.create({
      data: {
        brand: createRequest.brand,
        model: createRequest.model,
        customer_name: createRequest.customer_name,
        phone_number: createRequest.phone_number,
        description: createRequest.description,
        technician_note: createRequest.technician_note,
        status: "pending",
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
    id: number
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
    request: UpdateServiceRequest
  ): Promise<ServiceResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(RepairValidation.UPDATE, request);

    const oldService = await this.checkServiceExists(updateRequest.id);

    let currentItems: { price: number }[] = oldService.service_list;

    if (updateRequest.service_list) {
      currentItems = updateRequest.service_list;
    }

    const subTotal = currentItems.reduce(
      (total, item) => total + item.price,
      0
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
      status: updateRequest.status,
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
}
