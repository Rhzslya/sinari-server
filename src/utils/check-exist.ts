import type {
  Product,
  Service,
  ServiceItem,
  Technician,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";

export class CheckExist {
  static async checkProductExist(id: number): Promise<Product> {
    const product = await prismaClient.product.findUnique({
      where: {
        id: id,
      },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    return product;
  }

  static async checkServiceExists(
    id: number,
  ): Promise<
    Service & { service_list: ServiceItem[]; technician: Technician }
  > {
    const service = await prismaClient.service.findUnique({
      where: {
        id: id,
        deleted_at: null,
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
}
