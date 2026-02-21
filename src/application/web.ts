// file: src/application/web.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { publicRouter } from "../route/public-api";
import { errorMiddleware } from "../middleware/error-middleware";
import { apiRouter } from "../route/api";
import whatsappClient from "../lib/whatsapp";

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

console.log("Initializing WhatsApp Client...");
whatsappClient.initialize().catch((err) => {
  console.error("Failed to initialize WA Client:", err);
});

const shutdown = async () => {
  console.log("Shutting down server...");
  try {
    console.log("Closing WhatsApp Client...");
    await whatsappClient.destroy();
    console.log("WhatsApp Client closed.");
  } catch (e) {
    console.error("Error closing WhatsApp Client", e);
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

web.route("/", publicRouter);
web.route("/", apiRouter);

web.onError(errorMiddleware);
