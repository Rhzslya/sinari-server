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

  static readonly UPDATE = z.object({
    id: z.number().positive(),
    status: z
      .enum(["pending", "process", "finished", "cancelled", "taken"])
      .optional(),

    technician_note: z.string().optional(),
    discount: z.number().min(0).max(100).optional(),
    brand: z.string().min(1).max(100).optional(),
    model: z.string().min(1).max(100).optional(),
    customer_name: z.string().min(1).max(100).optional(),
    phone_number: z.string().min(1).max(20).optional(),
    description: z.string().max(255).optional(),
    service_list: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.number().positive(),
        })
      )
      .optional(),
  });

  static readonly SEARCH = z.object({
    brand: z.string().min(1).max(100).optional(),
    model: z.string().min(1).max(100).optional(),
    customer_name: z.string().min(1).max(100).optional(),
    phone_number: z.string().min(1).max(100).optional(),
    status: z
      .enum(["pending", "process", "finished", "cancelled", "taken"])
      .optional(),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
  });
}
