import z from "zod";
import { Brand, Category } from "../../generated/prisma/enums";

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
}
