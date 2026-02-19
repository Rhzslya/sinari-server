import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../lib/redis";
import type { Context, Next } from "hono";
import { getConnInfo } from "hono/bun";
import { routePath } from "hono/route";

const authRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), //5
  analytics: true,
  prefix: "ratelimit_auth",
});

const writeRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), //20
  analytics: true,
  prefix: "ratelimit_write",
});

const readRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "3 m"), //100
  analytics: true,
  prefix: "ratelimit_read",
});
const createLimiterMiddleware = (limiter: Ratelimit) => {
  return async (c: Context, next: Next) => {
    const info = getConnInfo(c);
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0] ||
      info.remote.address ||
      "unknown_ip";

    const method = c.req.method;
    const pattern = routePath(c);

    const redisKey = `${method}_${pattern}_${ip}`;
    const { success, limit, remaining, reset } = await limiter.limit(redisKey);

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      c.header("Retry-After", retryAfterSeconds.toString());
      return c.json(
        { errors: `Too many requests. Try again in ${retryAfterSeconds}s.` },
        429,
      );
    }
    await next();
  };
};

export const authLimiterMiddleware = createLimiterMiddleware(authRateLimiter);
export const writeLimiterMiddleware = createLimiterMiddleware(writeRateLimiter);
export const readLimiterMiddleware = createLimiterMiddleware(readRateLimiter);
