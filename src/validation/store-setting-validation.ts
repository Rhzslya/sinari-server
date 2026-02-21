import z from "zod";

const INDONESIAN_PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export class StoreSettingValidation {
  static readonly UPDATE = z.object({
    id: z.number().positive(),
    store_name: z.string().min(1, "Store name is required").max(100),
    store_address: z
      .string()
      .min(1, "Address is required")
      .max(500, "Address is too long"),
    store_phone: z
      .string()
      .min(9, { message: "Min 9 digits" })
      .max(15, { message: "Max 15 digits" })
      .regex(INDONESIAN_PHONE_REGEX, {
        message: "Wrong Format",
      }),
    store_email: z
      .email()
      .min(1, "Email is required")
      .max(100, "Email is too long")
      .or(z.literal(""))
      .optional(),
    store_website: z
      .url("Must be a valid URL (e.g., https://example.com)")
      .max(100, "Website is too long")
      .or(z.literal(""))
      .or(z.literal(""))
      .optional(),
    warranty_text: z
      .string()
      .min(1, "Warranty text is required")
      .max(2000, "Text is too long"),

    payment_info: z
      .string()
      .min(1, "Payment info is required")
      .max(1000, "Text is too long"),
  });
}
