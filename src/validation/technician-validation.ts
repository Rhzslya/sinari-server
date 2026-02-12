import z from "zod";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SIGNATURE_SIZE,
} from "../type/cloudinary-type";

export class TechnicianValidation {
  static readonly CREATE = z.object({
    name: z.string().min(1).max(100),
    signature: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_SIGNATURE_SIZE)
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .optional(),
    delete_image: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().optional(),
    ),
    is_active: z.preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return Boolean(val);
    }, z.boolean().default(true)),
  });

  static readonly UPDATE = z.object({
    id: z.number().positive(),
    name: z.string().min(1).max(100).optional(),
    signature: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_SIGNATURE_SIZE)
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .optional(),
    delete_image: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().optional(),
    ),
    is_active: z
      .preprocess((val) => {
        if (typeof val === "string") return val === "true";
        return Boolean(val);
      }, z.boolean().default(true))
      .optional(),
  });

  static readonly SEARCH = z.object({
    name: z.string().min(1).max(100).optional(),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
    is_active: z
      .preprocess((val) => {
        if (typeof val === "string") return val === "true";
        return Boolean(val);
      }, z.boolean().default(true))
      .optional(),
    sort_by: z.enum(["created_at", "is_active", "name"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
  });
}
