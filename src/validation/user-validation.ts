import z, { email } from "zod";
import { UserRole } from "../../generated/prisma/enums";

const strongPassword = z
  .string()
  .min(8, "Password minimum 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /(?=.*[!@#$%^&*])/,
    "Password must contain at least one special character",
  );

export class UserValidation {
  static readonly REGISTER = z.object({
    email: z.email().min(1, "Email is required").max(100, "Email is too long"),

    username: z
      .string()
      .min(3, "Username minimum 3 characters")
      .max(100, "Username is too long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username must contain only letters, numbers, and underscores",
      ),

    password: strongPassword,

    name: z.string().min(1, "Name is required").max(100, "Name is too long"),

    secondary_number: z.string().optional(),
  });

  static readonly UPDATE = z
    .object({
      email: z.email().min(1).max(100).optional(),
      password: strongPassword.optional(),
      current_password: z
        .string()
        .min(1, "Current password is required")
        .max(100)
        .optional(),
      name: z.string().min(1).max(100).optional(),
    })
    .refine(
      (data) => {
        if (data.password !== undefined && !data.current_password) {
          return false;
        }
        return true;
      },
      {
        message: "Current password is required to change your password",
        path: ["current_password"],
      },
    );

  static readonly UPDATE_ROLE = z.object({
    id: z.number().positive(),
    role: z.enum(UserRole),
  });

  static readonly SEARCH = z.object({
    username: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(),
    is_deleted: z.preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return Boolean(val);
    }, z.boolean().optional()),
    page: z.coerce.number().min(1).positive().default(1),
    size: z.coerce.number().min(1).max(100).positive().default(10),
    sort_by: z.enum(["created_at", "name"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    is_online: z.boolean().optional(),
    role: z.enum(UserRole).optional(),
  });

  static readonly LOGIN = z.object({
    identifier: z
      .string()
      .min(1, "Username or Email is required")
      .superRefine((val, ctx) => {
        if (val.includes("@")) {
          const isEmailValid = z.email().safeParse(val).success;

          if (!isEmailValid) {
            ctx.addIssue({
              code: "custom",
              message: "Invalid email address",
            });
          }
          return;
        }

        if (val.length < 3) {
          ctx.addIssue({
            code: "custom",
            message: "Username must be at least 3 characters",
          });
        }
      })
      .max(100, "Username/Email is too long"),
    password: z.string().min(8, "Password is required"),
  });

  static readonly FORGOT_PASSWORD = z.object({
    identifier: z
      .string()
      .min(1, "Username or Email is required")
      .max(100, "Username/Email is too long")
      .superRefine((val, ctx) => {
        if (val.includes("@")) {
          const isEmailValid = z.email().safeParse(val).success;

          if (!isEmailValid) {
            ctx.addIssue({
              code: "custom",
              message: "Invalid email address",
            });
          }
          return;
        }

        if (val.length < 3) {
          ctx.addIssue({
            code: "custom",
            message: "Username must be at least 3 characters",
          });
        }
      }),
  });

  static readonly GOOGLE_LOGIN = z.object({
    token: z.string().min(1).max(2000),
  });

  static readonly RESET_PASSWORD = z
    .object({
      token: z.string().min(1, "Token is required"),
      new_password: strongPassword,
      confirm_new_password: z
        .string()
        .min(8, "Confirmation password is required"),
    })
    .refine((data) => data.new_password === data.confirm_new_password, {
      message: "Passwords do not match",
      path: ["confirm_new_password"],
    });

  static readonly RESTORE = z.object({
    id: z.number().min(1).positive(),
  });
}
