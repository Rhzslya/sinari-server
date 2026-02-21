import { web } from "./application/web";

web.get("/", (c) => {
  return c.text("Halo, Sinari Server is Running");
});

export default {
  port: 3000,
  fetch: web.fetch,
};
