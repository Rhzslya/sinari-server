import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import {
  toServiceResponse,
  type CreateServiceRequest,
  type ServiceResponse,
} from "../model/repair-model";
import { RepairValidation } from "../validation/repair-validation";
import { Validation } from "../validation/validation";

export class ServicesDataService {
  static async create(request: CreateServiceRequest): Promise<ServiceResponse> {
    const createRequest = Validation.validate(RepairValidation.CREATE, request);

    const subTotal = createRequest.service_list.reduce(
      (total, item) => total + item.price,
      0
    );

    const discountAmount = (subTotal * (createRequest.discount || 0)) / 100;
    const totalPrice = subTotal - discountAmount;

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
      },
      include: {
        service_list: true,
      },
    });

    return toServiceResponse(service);
  }
}
