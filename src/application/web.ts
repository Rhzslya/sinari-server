// file: src/application/web.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { csrf } from "hono/csrf";
import { publicRouter } from "../route/public-api";
import { errorMiddleware } from "../middleware/error-middleware";
import { apiRouter } from "../route/api";
import whatsappClient from "../lib/whatsapp";

export const web = new Hono();

web.use("*", secureHeaders());

const allowedOrigins = [
  "http://localhost:5173",
  // "https://sinari.vercel.app" //Your Domain
];

web.use(
  "/*",
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

web.use(
  "*",
  csrf({
    origin: allowedOrigins,
  }),
);

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
