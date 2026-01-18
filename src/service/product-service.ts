import type { Product, User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ResponseError } from "../error/response-error";
import {
  toProductPublicResponse,
  toProductResponse,
  type CreateProductRequest,
  type ProductPublicResponse,
  type ProductResponse,
  type UpdateProductRequest,
} from "../model/product-model";
import { ProductValidation } from "../validation/product-validation";
import { Validation } from "../validation/validation";

export class ProductsService {
  static async create(
    user: User,
    request: CreateProductRequest,
  ): Promise<ProductResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(
      ProductValidation.CREATE,
      request,
    );

    const countExistingProduct = await prismaClient.product.count({
      where: {
        name: createRequest.name,
        manufacturer: createRequest.manufacturer?.toUpperCase() || "ORIGINAL",
        brand: createRequest.brand,
        category: createRequest.category,
      },
    });

    if (countExistingProduct > 0) {
      throw new ResponseError(
        400,
        "Product already exists (Same Name, Brand, Manufacturer & Category)",
      );
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

  static async get(
    user: User | null,
    id: number,
  ): Promise<ProductResponse | ProductPublicResponse> {
    const product = await this.checkProductExist(id);

    if (user && user.role === "admin") {
      return toProductResponse(product);
    }

    return toProductPublicResponse(product);
  }

  static async update(
    user: User,
    request: UpdateProductRequest,
  ): Promise<ProductResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const oldProduct = await this.checkProductExist(request.id);

    const updateRequest = Validation.validate(
      ProductValidation.UPDATE,
      request,
    );

    if (
      updateRequest.name ||
      updateRequest.manufacturer ||
      updateRequest.brand ||
      updateRequest.category
    ) {
      const nameCheck = updateRequest.name ?? oldProduct.name;
      const manufacturerCheck = updateRequest.manufacturer
        ? updateRequest.manufacturer.toUpperCase()
        : oldProduct.manufacturer;
      const brandCheck = updateRequest.brand ?? oldProduct.brand;
      const categoryCheck = updateRequest.category ?? oldProduct.category;

      const countExistingProduct = await prismaClient.product.count({
        where: {
          name: nameCheck,
          manufacturer: manufacturerCheck,
          brand: brandCheck,
          category: categoryCheck,
          id: {
            not: request.id,
          },
        },
      });

      if (countExistingProduct > 0) {
        throw new ResponseError(
          400,
          "Product already exists (Same Name, Brand, Manufacturer & Category)",
        );
      }
    }

    const product = await prismaClient.product.update({
      where: {
        id: request.id,
      },
      data: {
        name: updateRequest.name,
        brand: updateRequest.brand,
        manufacturer: updateRequest.manufacturer?.toUpperCase(),
        category: updateRequest.category,
        price: updateRequest.price,
        cost_price: updateRequest.cost_price,
        stock: updateRequest.stock,
      },
    });

    return toProductResponse(product);
  }

  static async remove(user: User, id: number): Promise<ProductResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const product = await this.checkProductExist(id);

    await prismaClient.product.delete({
      where: {
        id: id,
      },
    });

    return toProductResponse(product);
  }
}
