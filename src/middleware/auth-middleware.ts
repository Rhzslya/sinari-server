import type { Context, Next } from "hono"; // 1. Import 'Next'
import { prismaClient } from "../application/database";
import type { ApplicationVariables } from "../type/hono-context";

export const authMiddleware = async (
  c: Context<{ Variables: ApplicationVariables }>,
  next: Next,
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401,
    );
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json(
      {
        errors: "Unauthorized",
      },
      401,
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
      401,
    );
  }

  if (user.token_expired_at) {
    const now = new Date().getTime();
    const expiredTime = user.token_expired_at.getTime();

    if (now > expiredTime) {
      await prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          token: null,
          token_expired_at: null,
        },
      });

      return c.json({ errors: "Token Expired" }, 401);
    }

    const threshold = 23 * 60 * 60 * 1000;

    if (expiredTime - now < threshold) {
      await prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          token_expired_at: new Date(now + 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  c.set("user", user);

  await next();
};
