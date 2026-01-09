import type { Context, Next } from "hono"; // 1. Import 'Next'
import { prismaClient } from "../application/database";
import type { ApplicationVariables } from "../type/hono-context";

export const authMiddleware = async (
  c: Context<{ Variables: ApplicationVariables }>,
  next: Next
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401
    );
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401
    );
  }

  const user = await prismaClient.user.findFirst({
    where: {
      token: token,
    },
  });

  if (!user) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401
    );
  }

  c.set("user", user);

  await next();
};
