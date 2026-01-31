import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { prismaClient } from "../application/database";
import type { ApplicationVariables } from "../type/hono-context";

export const authMiddleware = async (
  c: Context<{ Variables: ApplicationVariables }>,
  next: Next,
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ errors: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json({ errors: "Unauthorized" }, 401);
  }

  try {
    const payload = await verify(token, process.env.JWT_SECRET!, "HS256");

    const user = await prismaClient.user.findFirst({
      where: {
        id: payload.id as number,
        token: token,
      },
    });

    if (!user) {
      return c.json({ errors: "Unauthorized - Session Expired" }, 401);
    }

    c.set("user", user);

    await next();
  } catch (e) {
    return c.json({ errors: "Unauthorized - Invalid Token" }, 401);
  }
};
