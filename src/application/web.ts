import { Hono } from "hono";
import { apiRouter } from "../route/api";
import { publicRouter } from "../route/public-api";
import { errorMiddleware } from "../middleware/error-middleware";
import { rateLimiter } from "hono-rate-limiter";

export const web = new Hono();

const generalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const ip = c.req.header("x-forwarded-for");
    return ip ? ip.split(",")[0] : "unknown";
  },
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const ip = c.req.header("x-forwarded-for");
    return ip ? ip.split(",")[0] : "unknown";
  },
  message: {
    message: "Too many login attempts, please try again after 15 minutes.",
  },
});

web.use("/api/users/login", authLimiter);

web.use("/api/*", generalLimiter);

// REGISTER ROUTES

web.route("/", publicRouter);
web.route("/", apiRouter);

// ERROR HANDLER
web.onError(errorMiddleware);
