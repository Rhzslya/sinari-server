import z, { email } from "zod";

export class UserValidation {
  static readonly REGISTER = z.object({
    email: email().min(1).max(100),
    username: z.string().min(1).max(100),
    password: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
  });

  static readonly UPDATE = z.object({
    password: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(),
  });

  static readonly LOGIN = z.object({
    email: email().min(1).max(100).optional(),
    username: z.string().min(1).max(100).optional(),
    password: z.string().min(1).max(100),
  });

  static readonly GOOGLE_LOGIN = z.object({
    token: z.string().min(1).max(100),
  });
}
