import type { Context } from "hono";
import type { User } from "../../generated/prisma/client";
import type {
  GetDetailedStoreSettingRequest,
  UpdateStoreSettingRequest,
} from "../model/store-setting-model";
import { StoreSettingService } from "../service/store-setting-service";

export class StoreSettingController {
  static async update(c: Context) {
    try {
      const user = c.var.user as User;

      const request = (await c.req.json()) as UpdateStoreSettingRequest;

      request.id = 1;

      const response = await StoreSettingService.update(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async get(c: Context) {
    try {
      const user = c.var.user as User;

      const request: GetDetailedStoreSettingRequest = {
        id: 1,
      };

      const response = await StoreSettingService.get(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
