import type { Context, Next } from "hono";
import type { ApplicationVariables } from "../type/hono-context";

export const adminMiddleware = async (
  c: Context<{ Variables: ApplicationVariables }>,
  next: Next,
) => {
  const user = c.var.user;

  if (!user) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401,
    );
  }

  if (user.role !== "admin") {
    return c.json(
      {
        errors: "Forbidden: Insufficient permissions",
      },
      403,
    );
  }

  await next();
};
