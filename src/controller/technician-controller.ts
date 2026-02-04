import type { Context } from "hono";
import type {
  CreateTechnicianRequest,
  SearchTechnicianRequest,
  UpdateTechnicianRequest,
} from "../model/technician-model";
import type { User } from "../../generated/prisma/client";
import { ResponseError } from "../error/response-error";
import { TechnicianService } from "../service/technician-service";

export class TechnicianController {
  static async create(c: Context) {
    try {
      const user = c.var.user as User;

      let request: CreateTechnicianRequest = {} as CreateTechnicianRequest;
      const contentType = c.req.header("Content-Type") || "";

      if (contentType.includes("application/json")) {
        request = await c.req.json();
      } else if (contentType.includes("multipart/form-data")) {
        const body = await c.req.parseBody();
        request = body as unknown as CreateTechnicianRequest;
      } else {
        throw new ResponseError(
          400,
          "Content-Type must be application/json or multipart/form-data",
        );
      }

      const response = await TechnicianService.create(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async update(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      let request: UpdateTechnicianRequest = {} as UpdateTechnicianRequest;
      const contentType = c.req.header("Content-Type") || "";

      if (contentType.includes("application/json")) {
        request = await c.req.json();
      } else if (contentType.includes("multipart/form-data")) {
        const body = await c.req.parseBody();
        request = body as unknown as UpdateTechnicianRequest;
      }

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid technician ID");
      }

      request.id = id;

      const response = await TechnicianService.update(user, request);

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
        throw new ResponseError(400, "Invalid technician ID");
      }

      const response = await TechnicianService.get(user, id);

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
        throw new ResponseError(400, "Invalid technician ID");
      }

      await TechnicianService.remove(user, id);

      return c.json({
        message: `Technician With ID ${id} deleted successfully`,
      });
    } catch (error) {
      throw error;
    }
  }

  static async search(c: Context) {
    try {
      const user = c.var.user as User;

      const request: SearchTechnicianRequest = {
        name: c.req.query("name"),
        page: c.req.query("page") ? Number(c.req.query("page")) : 1,
        size: c.req.query("size") ? Number(c.req.query("size")) : 10,

        is_active: c.req.query("is_active") === "true",

        sort_by: c.req.query("sort_by") as "created_at" | "is_active",
        sort_order: c.req.query("sort_order") as "asc" | "desc",
      };

      const response = await TechnicianService.search(user, request);

      return c.json(response);
    } catch (error) {
      throw error;
    }
  }
}
