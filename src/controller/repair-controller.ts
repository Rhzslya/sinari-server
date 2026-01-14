import type { Context } from "hono";
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../model/repair-model";
import { ServicesDataService } from "../service/repair-service";
import type { User } from "../../generated/prisma/client";

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
        throw new Error("Invalid service ID");
      }

      const response = await ServicesDataService.get(user, id);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async getPublic(c: Context) {
    const token = c.req.param("token");
    const response = await ServicesDataService.getByToken(token);
    return c.json({ data: response });
  }

  static async update(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new Error("Invalid service ID");
      }

      const request = (await c.req.json()) as UpdateServiceRequest;

      request.id = id;

      const response = await ServicesDataService.update(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
