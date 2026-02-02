import z from "zod";
import { Brand, Category } from "../../generated/prisma/enums";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "../type/cloudinary-type";

const BRAND_VALUES = Object.values(Brand) as [string, ...string[]];
const CATEGORY_VALUES = Object.values(Category) as [string, ...string[]];

export class ProductValidation {
  static readonly CREATE = z.object({
    name: z.string().min(1).max(100),
    brand: z.enum(Brand).default(Brand.OTHER),
    manufacturer: z.string().min(1).max(100).default("ORIGINAL"),
    price: z.coerce.number().min(0).positive(),
    cost_price: z.coerce.number().min(0).positive(),
    stock: z.coerce.number().min(0).default(0),
    category: z.enum(Category).default(Category.OTHER),
    image: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_FILE_SIZE)
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .optional(),
  });

  static readonly UPDATE = z.object({
    id: z.number().positive(),
    name: z.string().min(1).max(100).optional(),
    brand: z.enum(Brand).optional(),
    manufacturer: z.string().min(1).max(100).optional(),
    price: z.coerce.number().min(0).positive().optional(),
    cost_price: z.coerce.number().min(0).positive().optional(),
    stock: z.coerce.number().min(0).optional(),
    category: z.enum(Category).optional(),
    image: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_FILE_SIZE)
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .optional(),
    delete_image: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().optional(),
    ),
  });

  static readonly SEARCH = z.object({
    name: z.string().min(1).max(100).optional(),
    brand: z.enum(BRAND_VALUES).optional(),
    manufacturer: z.string().min(1).max(100).optional(),
    category: z.enum(CATEGORY_VALUES).optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    in_stock_only: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).default(1),
    size: z.coerce.number().min(1).max(100).default(10),
    sort_by: z.enum(["price", "stock", "created_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
  });
}
