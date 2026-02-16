import type { Context } from "hono";
import type { User } from "../../generated/prisma/client";
import { ResponseError } from "../error/response-error";
import { ProductLogService } from "../service/product-logs-service";

export class ProductLogController {
  static async get(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid product log ID");
      }

      const response = await ProductLogService.getLogs(user, id);

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }

  static async voidLog(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid product log ID");
      }

      const response = await ProductLogService.voidProductLogs(user, { id });

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }
}
