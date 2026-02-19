import type { Context } from "hono";
import { DashboardService } from "../service/dashboard-service";

export class DashboardController {
  static async get(c: Context) {
    try {
      const user = c.var.user;

      const response = await DashboardService.getStats(user);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
