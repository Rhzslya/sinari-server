import type { Context } from "hono";
import { Mail } from "../utils/mail";
import type { ContactUsRequest } from "../model/mail-model";

export class ContactController {
  static async sendContactUsMail(c: Context) {
    try {
      const request = (await c.req.json()) as ContactUsRequest;

      await Mail.sendContactUsMail(request);

      return c.json({
        data: {
          message: "Mail sent successfully",
        },
      });
    } catch (error) {
      console.error("Error sending contact email:", error);
      throw error;
    }
  }
}
