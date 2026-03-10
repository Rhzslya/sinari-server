import z from "zod";

export const strongPassword = z
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
