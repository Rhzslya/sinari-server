import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { prismaClient } from "../application/database";
import type { ApplicationVariables } from "../type/hono-context";
import { Redis } from "@upstash/redis";
import { getCookie } from "hono/cookie";
import type { JWTPayload } from "hono/utils/jwt/types";

const redis = Redis.fromEnv();

interface TokenPayload extends JWTPayload {
  id: number;
}

export const authMiddleware = async (
  c: Context<{ Variables: ApplicationVariables }>,
  next: Next,
) => {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.json({ errors: "Unauthorized" }, 401);
  }

  let payload: TokenPayload;

  try {
    payload = (await verify(
      token,
      process.env.JWT_SECRET!,
      "HS256",
    )) as TokenPayload;
  } catch (e) {
    return c.json(
      {
        errors: "Invalid or expired token",
        code: "INVALID_TOKEN",
      },
      401,
    );
  }

  const validAfterStr = await redis.get<number | string>(
    `session_valid_after:${payload.id}`,
  );

  if (validAfterStr && payload.iat) {
    const validAfter = Number(validAfterStr);
    if (Number(payload.iat) < validAfter) {
      return c.json(
        {
          errors:
            "Session expired because password was changed. Please login again.",
          code: "PASSWORD_CHANGED",
        },
        401,
      );
    }
  }

  const user = await prismaClient.user.findFirst({
    where: {
      id: payload.id,
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

  if (user.deleted_at !== null) {
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
};
