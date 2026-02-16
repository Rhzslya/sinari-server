import type { Context } from "hono";
import type {
  CreateServiceRequest,
  SearchServiceRequest,
  UpdateServiceRequest,
} from "../model/repair-model";
import { ServicesDataService } from "../service/repair-service";
import type { Brand, ServiceStatus, User } from "../../generated/prisma/client";
import { ResponseError } from "../error/response-error";

export class ServiceController {
  static async create(c: Context) {
    try {
      const request = (await c.req.json()) as CreateServiceRequest;

      const user = c.var.user as User;

      const response = await ServicesDataService.create(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async get(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid service ID");
      }

      const response = await ServicesDataService.get(user, id);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async getPublic(c: Context) {
    const identifier = c.req.param("identifier");

    const response = await ServicesDataService.trackPublic(identifier);
    return c.json({ data: response });
  }

  static async update(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid service ID");
      }

      const request = (await c.req.json()) as UpdateServiceRequest;

      request.id = id;

      const response = await ServicesDataService.update(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async remove(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid service ID");
      }

      await ServicesDataService.remove(user, id);

      return c.json({
        data: true,
        message: `Service With ID ${id} deleted successfully`,
      });
    } catch (error) {
      throw error;
    }
  }

  static async restore(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid service ID");
      }

      const response = await ServicesDataService.restore(user, { id });

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async search(c: Context) {
    try {
      const user = c.var.user as User;

      const rawStatus = c.req.query("status");

      const request: SearchServiceRequest = {
        service_id: c.req.query("service_id"),
        brand: c.req.query("brand") as Brand,
        model: c.req.query("model"),
        customer_name: c.req.query("customer_name"),
        status: rawStatus
          ? (rawStatus.toUpperCase() as ServiceStatus)
          : undefined,
        is_deleted: c.req.query("is_deleted")
          ? c.req.query("is_deleted") === "true"
          : undefined,

        page: c.req.query("page") ? Number(c.req.query("page")) : 1,
        size: c.req.query("size") ? Number(c.req.query("size")) : 10,

        min_price: c.req.query("min_price")
          ? Number(c.req.query("min_price"))
          : undefined,
        max_price: c.req.query("max_price")
          ? Number(c.req.query("max_price"))
          : undefined,

        sort_by: c.req.query("sort_by") as
          | "total_price"
          | "created_at"
          | "updated_at",
        sort_order: c.req.query("sort_order") as "asc" | "desc",
      };

      const response = await ServicesDataService.search(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
