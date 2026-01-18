import z from "zod";
import { Brand, Category } from "../../generated/prisma/enums";

const BRAND_VALUES = Object.values(Brand) as [string, ...string[]];
const CATEGORY_VALUES = Object.values(Category) as [string, ...string[]];

export class ProductValidation {
  static readonly CREATE = z.object({
    name: z.string().min(1).max(100),
    brand: z.enum(Brand).default(Brand.OTHER),
    manufacturer: z.string().min(1).max(100).default("ORIGINAL"),
    price: z.number().min(0).positive(),
    cost_price: z.number().min(0).positive(),
    category: z.enum(Category).default(Category.OTHER),
    stock: z.number().min(0).default(0),
  });

  static readonly UPDATE = z.object({
    name: z.string().min(1).max(100).optional(),
    brand: z.enum(Brand).optional(),
    manufacturer: z.string().min(1).max(100).optional(),
    price: z.number().min(0).positive().optional(),
    cost_price: z.number().min(0).positive().optional(),
    category: z.enum(Category).optional(),
    stock: z.number().min(0).optional(),
  });

  static readonly SEARCH = z.object({
    name: z.string().min(1).max(100).optional(),
    brand: z.enum(BRAND_VALUES).optional(),
    manufacturer: z.string().min(1).max(100).optional(),
    category: z.enum(CATEGORY_VALUES).optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    in_stock_only: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
    sort_by: z.enum(["name", "price", "stock", "created_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
  });
}
