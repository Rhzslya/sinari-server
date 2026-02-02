import z from "zod";
import { Brand, ServiceStatus } from "../../generated/prisma/enums";

const SERVICE_STATUS_VALUES = Object.values(ServiceStatus) as [
  string,
  ...string[],
];
const BRAND_VALUES = Object.values(Brand) as [string, ...string[]];

export class RepairValidation {
  static readonly CREATE = z.object({
    brand: z.enum(Brand).default(Brand.OTHER),
    model: z.string().min(1).max(100),
    customer_name: z.string().min(1).max(100),
    phone_number: z.string().min(1).max(100),
    description: z.string().max(100).optional(),
    technician_note: z.string().max(100).optional(),
    service_list: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          price: z.number().min(1000).positive(),
        }),
      )
      .min(1),
    discount: z.number().min(0).max(100).optional(),
  });

  static readonly UPDATE = z.object({
    id: z.number().positive(),
    customer_name: z.string().min(1).max(100).optional(),
    phone_number: z.string().min(1).max(20).optional(),
    model: z.string().min(1).max(100).optional(),
    status: z.enum(SERVICE_STATUS_VALUES).optional(),
    technician_note: z.string().max(100).optional(),
    discount: z.number().min(0).max(100).optional(),
    brand: z.enum(Brand).optional(),
    description: z.string().max(100).optional(),
    service_list: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.number().positive(),
        }),
      )
      .optional(),
  });

  static readonly SEARCH = z.object({
    servive_id: z.string().min(1).max(100).optional(),
    brand: z.enum(BRAND_VALUES).optional(),
    model: z.string().min(1).max(100).optional(),
    customer_name: z.string().min(1).max(100).optional(),
    phone_number: z.string().min(1).max(100).optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    status: z.enum(SERVICE_STATUS_VALUES).optional(),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
    sort_by: z.enum(["total_price", "created_at", "updated_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
  });
}
