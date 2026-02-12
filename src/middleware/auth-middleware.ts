import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { prismaClient } from "../application/database";
import type { ApplicationVariables } from "../type/hono-context";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

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
      return c.json(
        {
          errors: "Session expired. You are logged in on another device.",
          code: "SESSION_EXPIRED",
        },
        401,
      );
    }

    if (!user.is_active) {
      return c.json(
        {
          errors: "Your account has been banned or is inactive.",
          code: "ACCOUNT_BANNED",
        },
        403,
      );
    }

    c.set("user", user);

    try {
      await redis.set(`online_users:${user.id}`, "true", { ex: 300 });
    } catch (redisError) {
      console.error("Failed to update session", redisError);
    }

    await next();
  } catch (e) {
    return c.json(
      {
        errors: "Invalid or expired token",
        code: "INVALID_TOKEN",
      },
      401,
    );
  }
};
