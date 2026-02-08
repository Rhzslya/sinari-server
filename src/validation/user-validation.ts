import z, { email } from "zod";
import { UserRole } from "../../generated/prisma/enums";

export class UserValidation {
  static readonly REGISTER = z.object({
    email: email().min(1).max(100),
    username: z.string().min(3).max(100),
    password: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
  });

  static readonly UPDATE = z.object({
    email: email().min(1).max(100).optional(),
    password: z.string().min(1).max(100).optional(),
    current_password: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(),
  });

  static readonly UPDATE_ROLE = z.object({
    id: z.number().positive(),
    role: z.enum(UserRole),
  });

  static readonly SEARCH = z.object({
    username: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
    sort_by: z.enum(["created_at", "name"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    is_online: z.boolean().optional(),
    role: z.enum(UserRole).optional(),
  });

  static readonly LOGIN = z.object({
    email: email().min(1).max(100).optional(),
    username: z.string().min(1).max(100).optional(),
    password: z.string().min(1).max(100),
  });

  static readonly FORGOT_PASSWORD = z.object({
    identifier: z.string().min(1).max(100),
  });

  static readonly GOOGLE_LOGIN = z.object({
    token: z.string().min(1).max(2000),
  });

  static readonly RESET_PASSWORD = z.object({
    token: z.string().min(1).max(100),
    new_password: z.string().min(1).max(100),
    confirm_new_password: z.string().min(1).max(100),
  });
}
