import type { Context } from "hono";
import type { CreateServiceRequest } from "../model/repair-model";
import { ServicesDataService } from "../service/repair-service";

export class ServiceController {
  static async create(c: Context) {
    try {
      const request = (await c.req.json()) as CreateServiceRequest;

      const response = await ServicesDataService.create(request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
