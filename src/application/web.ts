// file: src/application/web.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { publicRouter } from "../route/public-api";
import { errorMiddleware } from "../middleware/error-middleware";
import { apiRouter } from "../route/api";

export const web = new Hono();

web.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

web.route("/", publicRouter);
web.route("/", apiRouter);

web.onError(errorMiddleware);
