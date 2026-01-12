import z from "zod";

export class RepairValidation {
  static readonly CREATE = z.object({
    brand: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    customer_name: z.string().min(1).max(100),
    phone_number: z.string().min(1).max(100),
    description: z.string().min(1).max(100).optional(),
    technician_note: z.string().min(1).max(100).optional(),
    service_list: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          price: z.number().min(1000).positive(),
        })
      )
      .min(1, { message: "Service list must have at least 1 service" }),
    discount: z.number().min(0).max(100).optional(),
  });
}
