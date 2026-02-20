import { web } from "./application/web";

web.get("/", (c) => {
  return c.text("Halo, Sinari Server is Running");
});

// console.log("Initializing WhatsApp Client...");
// whatsappClient.initialize().catch((err) => {
//   console.error("Failed to initialize WA Client:", err);
// });

// const shutdown = async () => {
//   console.log("Shutting down server...");
//   try {
//     console.log("Closing WhatsApp Client...");
//     await whatsappClient.destroy();
//     console.log("WhatsApp Client closed.");
//   } catch (e) {
//     console.error("Error closing WhatsApp Client", e);
//   }
//   process.exit(0);
// };

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

export default {
  port: 3000,
  fetch: web.fetch,
};
