import type { Context } from "hono";
import type { User } from "../../generated/prisma/client";
import { ResponseError } from "../error/response-error";
import { RepairLogService } from "../service/repair-logs-service";

export class ServiceLogController {
  static async get(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid service log ID");
      }

      const response = await RepairLogService.getLogs(user, { id });

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }
}
