import type { Context } from "hono";
import { WhatsappService } from "../lib/whatsapp";
import type { User } from "../../generated/prisma/client";

export class WhatsappController {
  static async getStatus(c: Context) {
    try {
      const user = c.get("user") as User;

      const response = WhatsappService.getStatus(user);
      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async disconnect(c: Context) {
    try {
      const user = c.get("user") as User;
      const response = await WhatsappService.disconnectDevice(user);
      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
