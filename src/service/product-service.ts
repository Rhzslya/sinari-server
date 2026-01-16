import type { User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ResponseError } from "../error/response-error";
import {
  toProductResponse,
  type CreateProductRequest,
  type ProductResponse,
} from "../model/product-model";
import { ProductValidation } from "../validation/product-validation";
import { Validation } from "../validation/validation";

export class ProductsService {
  static async create(
    user: User,
    request: CreateProductRequest
  ): Promise<ProductResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(
      ProductValidation.CREATE,
      request
    );

    const countExistingProduct = await prismaClient.product.count({
      where: {
        name: createRequest.name,
        manufacturer: createRequest.manufacturer?.toUpperCase() || "ORIGINAL",
      },
    });

    if (countExistingProduct > 0) {
      throw new ResponseError(400, "Product with this name already exists");
    }

    const product = await prismaClient.product.create({
      data: {
        name: createRequest.name,
        brand: createRequest.brand,
        manufacturer: createRequest.manufacturer!.toUpperCase(),
        price: createRequest.price,
        cost_price: createRequest.cost_price,
        category: createRequest.category,
        stock: createRequest.stock,
      },
    });

    return toProductResponse(product);
  }
}
