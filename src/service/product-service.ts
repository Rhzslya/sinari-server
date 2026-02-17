import {
  ProductLogAction,
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
  type CheckProductExistRequest,
  type CreateProductRequest,
  type DeleteProductRequest,
  type GetDetailedProductRequest,
  type ProductPublicResponse,
  type ProductResponse,
  type RestoreProductRequest,
  type SearchProductRequest,
  type UpdateProductRequest,
} from "../model/product-model";
import { isValidFile } from "../utils/cloudinary-guard";
import { fmt } from "../utils/format-rupiah";
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

    if (createRequest.price < createRequest.cost_price) {
      throw new ResponseError(
        400,
        "Selling price cannot be lower than cost price.",
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
        manufacturer: (createRequest.manufacturer || "ORIGINAL").toUpperCase(),
        price: createRequest.price,
        cost_price: createRequest.cost_price,
        category: createRequest.category,
        stock: createRequest.stock ?? 0,
        image_url: imageUrl,
        product_logs: {
          create: {
            user_id: user.id,
            action: ProductLogAction.CREATED,
            quantity_change: createRequest.stock || 0,
            description: `Initial product registration. Stock: ${createRequest.stock || 0}, Price: ${fmt(createRequest.price)}, Cost: ${fmt(createRequest.cost_price)}`,
            total_revenue: 0,
            total_profit: 0,
          },
        },
      },
    });

    return toProductResponse(product);
  }

  static async checkProductExist(
    request: CheckProductExistRequest,
  ): Promise<Product> {
    const product = await prismaClient.product.findUnique({
      where: {
        id: request.id,
        deleted_at: null,
      },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    return product;
  }

  static async get(
    user: User | null,
    request: GetDetailedProductRequest,
  ): Promise<ProductResponse | ProductPublicResponse> {
    const product = await this.checkProductExist({ id: request.id });
    if (
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.OWNER)
    ) {
      return toProductResponse(product);
    }

    return toProductPublicResponse(product);
  }

  static async remove(
    user: User,
    request: DeleteProductRequest,
  ): Promise<boolean> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const product = await this.checkProductExist({ id: request.id });

    if (product.image_url) {
      await CloudinaryService.deleteImage(product.image_url);
    }

    await prismaClient.product.update({
      where: {
        id: request.id,
      },
      data: {
        deleted_at: new Date(),
        image_url: null,
      },
    });

    await prismaClient.productLog.create({
      data: {
        product_id: request.id,
        user_id: user.id,
        action: ProductLogAction.DELETED,
        quantity_change: 0,
        description: `Product moved to trash (soft delete)`,
      },
    });

    return true;
  }

  static async restore(
    user: User,
    request: RestoreProductRequest,
  ): Promise<ProductResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const restoreRequest = Validation.validate(
      ProductValidation.RESTORE,
      request,
    );

    const productInTrash = await prismaClient.product.findFirst({
      where: {
        id: restoreRequest.id,
        deleted_at: { not: null },
      },
    });

    if (!productInTrash) {
      throw new ResponseError(
        404,
        "Product not found in trash bin. It might be active or permanently deleted.",
      );
    }

    const [restoredProduct, _log] = await prismaClient.$transaction([
      prismaClient.product.update({
        where: { id: restoreRequest.id },
        data: { deleted_at: null },
      }),

      prismaClient.productLog.create({
        data: {
          product_id: restoreRequest.id,
          user_id: user.id,
          action: ProductLogAction.RESTORED,
          quantity_change: 0,
          description: "Product restored from trash bin",
        },
      }),
    ]);

    return toProductResponse(restoredProduct);
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
      deleted_at: searchRequest.is_deleted ? { not: null } : null,
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

    const oldProduct = await this.checkProductExist({ id: updateRequest.id });

    const finalPrice = updateRequest.price ?? oldProduct.price;
    const finalCost = updateRequest.cost_price ?? oldProduct.cost_price;

    if (finalCost > finalPrice) {
      throw new ResponseError(
        400,
        "Cannot update: Cost price cannot exceed selling price.",
      );
    }

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
    const audit = this.generatedAuditLogs(oldProduct, updateRequest);

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
        image_url: imageUrl,

        product_logs: {
          create: {
            user_id: user.id,
            action: audit.mainAction,
            quantity_change: 0,
            description: audit.description,
            total_revenue: audit.total_revenue,
            total_profit: audit.total_profit,
          },
        },
      },
    });

    return toProductResponse(product);
  }

  static async updateStock(
    user: User,
    request: Pick<UpdateProductRequest, "id" | "stock" | "stock_action">,
  ): Promise<ProductResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(
      ProductValidation.UPDATE_STOCK,
      request,
    );

    const newStock = updateRequest.stock as number;
    const action = updateRequest.stock_action as ProductLogAction;

    const oldProduct = await this.checkProductExist({ id: updateRequest.id });

    const quantityChange = newStock - oldProduct.stock;

    if (quantityChange === 0) {
      throw new ResponseError(
        400,
        "Stock value is exactly the same as current stock.",
      );
    }

    let total_revenue = 0;
    let total_profit = 0;

    if (quantityChange > 0) {
      const validPositiveActions: ProductLogAction[] = [
        ProductLogAction.RESTOCK,
        ProductLogAction.ADJUST_OPNAME,
      ];
      if (!validPositiveActions.includes(action)) {
        throw new ResponseError(
          400,
          `Action '${action}' is not allowed when stock increases.`,
        );
      }
    } else if (quantityChange < 0) {
      const validNegativeActions: ProductLogAction[] = [
        ProductLogAction.SALE_OFFLINE,
        ProductLogAction.ADJUST_DAMAGE,
        ProductLogAction.ADJUST_LOST,
        ProductLogAction.ADJUST_OPNAME,
      ];
      if (!validNegativeActions.includes(action)) {
        throw new ResponseError(
          400,
          `Action '${action}' is not allowed when stock decreases.`,
        );
      }

      if (action === ProductLogAction.SALE_OFFLINE) {
        const qtySold = Math.abs(quantityChange);
        total_revenue = oldProduct.price * qtySold;
        total_profit = (oldProduct.price - oldProduct.cost_price) * qtySold;
      }
    }

    const description = `Stock adjusted: ${oldProduct.stock} -> ${updateRequest.stock}. Reason: ${action}`;

    const product = await prismaClient.product.update({
      where: { id: request.id },
      data: {
        stock: updateRequest.stock,
        product_logs: {
          create: {
            user_id: user.id,
            action: action,
            quantity_change: quantityChange,
            description: description,
            total_revenue: total_revenue,
            total_profit: total_profit,
          },
        },
      },
    });

    return toProductResponse(product);
  }

  private static generatedAuditLogs(
    oldProduct: Product,
    req: UpdateProductRequest,
  ) {
    const logMessages: string[] = [];

    let mainAction: ProductLogAction = ProductLogAction.UPDATE_INFO;
    let quantityChange = 0;

    let total_revenue = 0;
    let total_profit = 0;

    let isMetadataChanged = false;
    if (req.name && req.name !== oldProduct.name) {
      logMessages.push(`Name changed from "${oldProduct.name}"`);
      isMetadataChanged = true;
    }
    if (req.brand && req.brand !== oldProduct.brand) isMetadataChanged = true;
    if (req.category && req.category !== oldProduct.category)
      isMetadataChanged = true;
    if (req.manufacturer && req.manufacturer !== oldProduct.manufacturer)
      isMetadataChanged = true;

    if (isMetadataChanged) {
      logMessages.push(`Catalog details updated`);
      mainAction = ProductLogAction.UPDATE_INFO;
    }

    if (req.image) {
      logMessages.push(`Image updated`);
      mainAction = ProductLogAction.UPDATE_INFO;
    }

    if (
      req.cost_price !== undefined &&
      req.cost_price !== oldProduct.cost_price
    ) {
      logMessages.push(
        `Cost: ${fmt(oldProduct.cost_price)} -> ${fmt(req.cost_price)}`,
      );
      mainAction = ProductLogAction.UPDATE_COST;
    }
    if (req.price !== undefined && req.price !== oldProduct.price) {
      logMessages.push(`Price: ${fmt(oldProduct.price)} -> ${fmt(req.price)}`);
      mainAction = ProductLogAction.UPDATE_PRICE;
    }

    if (req.stock !== undefined && req.stock !== oldProduct.stock) {
      quantityChange = req.stock - oldProduct.stock;
      logMessages.push(`Stock: ${oldProduct.stock} -> ${req.stock}`);

      const isSaleOffline = req.stock_action === ProductLogAction.SALE_OFFLINE;

      if (isSaleOffline) {
        const qtySold = Math.abs(quantityChange);
        total_revenue = oldProduct.price * qtySold;
        total_profit = (oldProduct.price - oldProduct.cost_price) * qtySold;
      }

      if (req.stock_action) {
        if (quantityChange > 0) {
          const validPositiveActions: ProductLogAction[] = [
            ProductLogAction.RESTOCK,
            ProductLogAction.ADJUST_OPNAME,
          ];
          if (!validPositiveActions.includes(req.stock_action)) {
            throw new ResponseError(
              400,
              `Validation Error: Action '${req.stock_action}' is not allowed when stock increases. Use RESTOCK or ADJUST_OPNAME.`,
            );
          }
        } else if (quantityChange < 0) {
          const validNegativeActions: ProductLogAction[] = [
            ProductLogAction.SALE_OFFLINE,
            ProductLogAction.ADJUST_DAMAGE,
            ProductLogAction.ADJUST_LOST,
            ProductLogAction.ADJUST_OPNAME,
          ];
          if (!validNegativeActions.includes(req.stock_action)) {
            throw new ResponseError(
              400,
              `Validation Error: Action '${req.stock_action}' is not allowed when stock decreases.`,
            );
          }
        }

        mainAction = req.stock_action;
      } else {
        mainAction = ProductLogAction.ADJUST_OPNAME;
      }

      logMessages.push(`Reason: ${mainAction}`);
    }

    const description =
      logMessages.length > 0
        ? logMessages.join(" | ")
        : "Product updated without specific changes";

    return {
      description,
      mainAction,
      quantityChange,
      total_revenue,
      total_profit,
    };
  }
}
