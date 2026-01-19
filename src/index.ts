import { Hono } from "hono";
import { cors } from "hono/cors";
import { publicRouter } from "./route/public-api";
import { errorMiddleware } from "./middleware/error-middleware";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.text("Halo, Sinari Server is Running");
});

app.route("/", publicRouter);

app.onError(errorMiddleware);

// Port default 3000
export default {
  port: 3000,
  fetch: app.fetch,
};
