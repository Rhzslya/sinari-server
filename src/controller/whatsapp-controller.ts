import type { Context } from "hono";
import { WhatsappService } from "../lib/whatsapp";

export class WhatsappController {
  static async getStatus(c: Context) {
    try {
      const response = WhatsappService.getStatus();

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async disconnect(c: Context) {
    try {
      const response = await WhatsappService.disconnectDevice();

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
