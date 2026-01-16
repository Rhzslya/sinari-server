import type { Context } from "hono";
import type { CreateProductRequest } from "../model/product-model";
import type { User } from "../../generated/prisma/client";
import { ProductsService } from "../service/product-service";

export class ProductController {
  static async create(c: Context) {
    try {
      const request = (await c.req.json()) as CreateProductRequest;

      const user = c.var.user as User;

      const response = await ProductsService.create(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
