import type { Context } from "hono";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../model/product-model";
import type { User } from "../../generated/prisma/client";
import { ProductsService } from "../service/product-service";
import { ResponseError } from "../error/response-error";
import { prismaClient } from "../application/database";

export class ProductController {
  static async create(c: Context) {
    try {
      const user = c.var.user as User;

      const request = (await c.req.json()) as CreateProductRequest;

      const response = await ProductsService.create(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async get(c: Context) {
    try {
      let user = null;

      const authHeader = c.req.header("Authorization");

      if (authHeader) {
        const token = authHeader.split(" ")[1];

        user = await prismaClient.user.findFirst({
          where: {
            token: token,
          },
        });

        if (!user) {
          throw new ResponseError(401, "Unauthorized: Invalid Token");
        }
      }

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid product ID");
      }

      const response = await ProductsService.get(user, id);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async update(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid product ID");
      }

      const request = (await c.req.json()) as UpdateProductRequest;

      request.id = id;

      const response = await ProductsService.update(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
