import z from "zod";
import { INDONESIAN_PHONE_REGEX } from "../utils/indonesia-phone-regex";

export class ContactValidation {
  static readonly CONTACT_US = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.email().min(1, "Email is required").max(100, "Email is too long"),
    subject: z
      .string()
      .min(1, "Subject is required")
      .max(100, "Subject is too long"),
    phone_number: z
      .union([
        z.literal(""),
        z
          .string()
          .min(9, { message: "Min 9 digits" })
          .max(15, { message: "Max 15 digits" })
          .regex(INDONESIAN_PHONE_REGEX, {
            message: "Wrong Format",
          }),
      ])
      .optional(),
    message: z
      .string()
      .min(10, "Message is too short (Minimum 10 characters)")
      .max(1000, "Message is too long (Maximum 1000 characters)"),
  });
}
