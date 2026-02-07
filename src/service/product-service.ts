import {
  UserRole,
  type Brand,
  type Category,
  type Prisma,
  type Product,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import type { Pageable } from "../model/page-model";
import {
  toProductPublicResponse,
  toProductResponse,
  type CreateProductRequest,
  type ProductPublicResponse,
  type ProductResponse,
  type SearchProductRequest,
  type UpdateProductRequest,
} from "../model/product-model";
import { isValidFile } from "../utils/cloudinary-guard";
import { ProductValidation } from "../validation/product-validation";
import { Validation } from "../validation/validation";
import { CloudinaryService } from "./cloudinary-service";

export class ProductsService {
  static async create(
    user: User,
    request: CreateProductRequest,
  ): Promise<ProductResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
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
        409,
        "Product already exists (Same Name, Brand, Manufacturer & Category)",
      );
    }

    let imageUrl = "";

    if (isValidFile(request.image)) {
      const sanitizedName = createRequest.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");

      const fileName = `${sanitizedName}-${Date.now()}`;

      imageUrl = await CloudinaryService.uploadImageProduct(
        request.image,
        "sinari-cell/products",
        fileName,
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
        image_url: imageUrl,
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

    if ((user && user.role === UserRole.ADMIN) || UserRole.OWNER) {
      return toProductResponse(product);
    }

    return toProductPublicResponse(product);
  }

  static async update(
    user: User,
    request: UpdateProductRequest,
  ): Promise<ProductResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(
      ProductValidation.UPDATE,
      request,
    );

    const oldProduct = await this.checkProductExist(updateRequest.id);

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

    let imageUrl = oldProduct.image_url;

    if (updateRequest.delete_image === true) {
      if (oldProduct.image_url) {
        await CloudinaryService.deleteImage(oldProduct.image_url);
      }
      imageUrl = null;
    } else if (isValidFile(request.image)) {
      const fileName = `${oldProduct.id}`;

      if (oldProduct.image_url) {
        await CloudinaryService.deleteImage(oldProduct.image_url);
      }

      imageUrl = await CloudinaryService.uploadImageProduct(
        request.image,
        "sinari-cell/products",
        fileName,
      );
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
        image_url: imageUrl,
      },
    });

    return toProductResponse(product);
  }

  static async remove(user: User, id: number): Promise<boolean> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const product = await this.checkProductExist(id);

    if (product.image_url) {
      await CloudinaryService.deleteImage(product.image_url);
    }

    await prismaClient.product.delete({
      where: {
        id: id,
      },
    });

    return true;
  }

  static async search(
    user: User | null,
    request: SearchProductRequest,
  ): Promise<Pageable<ProductResponse | ProductPublicResponse>> {
    const searchRequest = Validation.validate(
      ProductValidation.SEARCH,
      request,
    );

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const andFilters: Prisma.ProductWhereInput[] = [];

    if (searchRequest.name) {
      andFilters.push({
        OR: [
          { name: { contains: searchRequest.name } },
          { manufacturer: { contains: searchRequest.name } },
        ],
      });
    }

    if (searchRequest.brand) {
      andFilters.push({ brand: searchRequest.brand as Brand });
    }

    if (searchRequest.category) {
      andFilters.push({ category: searchRequest.category as Category });
    }

    if (searchRequest.min_price || searchRequest.max_price) {
      andFilters.push({
        price: {
          gte: searchRequest.min_price,
          lte: searchRequest.max_price,
        },
      });
    }

    if (searchRequest.in_stock_only) {
      andFilters.push({
        stock: { gt: 0 },
      });
    }

    const whereClause: Prisma.ProductWhereInput = {
      AND: andFilters,
    };

    const products = await prismaClient.product.findMany({
      where: whereClause,
      take: searchRequest.size,
      skip: skip,
      orderBy: {
        [searchRequest.sort_by || "created_at"]:
          searchRequest.sort_order || "desc",
      },
    });

    const totalItems = await prismaClient.product.count({
      where: whereClause,
    });

    const isNotCustomer = user && user.role !== UserRole.CUSTOMER;

    const data = products.map((product) => {
      if (isNotCustomer) {
        return toProductResponse(product);
      } else {
        return toProductPublicResponse(product);
      }
    });

    return {
      data: data,
      paging: {
        size: searchRequest.size,
        current_page: searchRequest.page,
        total_page: Math.ceil(totalItems / searchRequest.size),
      },
    };
  }
}
