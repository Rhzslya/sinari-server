import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Halo, Sinari Server is Running");
});

// Port default 3000
export default {
  port: 3000,
  fetch: app.fetch,
};
