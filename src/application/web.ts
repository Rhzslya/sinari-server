import { Hono } from "hono";
import { apiRouter } from "../route/api";
import { publicRouter } from "../route/public-api";
import { errorMiddleware } from "../middleware/error-middleware";

export const web = new Hono();

// public route first
web.route("/", publicRouter);
web.route("/", apiRouter);

// Must Bottom
web.onError(errorMiddleware);
