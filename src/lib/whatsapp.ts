import { Client, LocalAuth, type ClientOptions } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import type { WhatsappSendResult } from "../type/whatsapp-type";

const SESSION_PATH = path.join(process.cwd(), ".wwebjs_auth");
const CLIENT_ID = "sinari_v1";

const cleanStore = () => {
  const sessionDir = path.join(SESSION_PATH, `session-${CLIENT_ID}`);

  if (fs.existsSync(sessionDir)) {
    const lockFile = path.join(sessionDir, "SingletonLock");
    try {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        console.log("[WA Fix] SingletonLock removed.");
      }
    } catch (e) {
      console.log("[WA Fix] Cleaning skipped.");
    }
  }
};

cleanStore();

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    clientId: CLIENT_ID,
    dataPath: SESSION_PATH,
  }),
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--no-first-run",
      "--no-zygote",
    ],
    headless: true,
  } as ClientOptions["puppeteer"],
});

whatsappClient.on("qr", (qr) => {
  console.log("Scan QR code to login");
  qrcode.generate(qr, { small: true });
});

whatsappClient.on("authenticated", () => {
  console.log("WhatsApp Authenticated (Session saved!)");
});

whatsappClient.on("ready", () => {
  console.log("WhatsApp Client is Ready!");
});

whatsappClient.on("auth_failure", (msg) => {
  console.error("WA Auth Failure:", msg);
});

export class WhatsappService {
  static async sendMessage(
    to: string,
    message: string,
  ): Promise<WhatsappSendResult> {
    try {
      if (!whatsappClient.info) {
        return { success: false, error: "Whatsapp Client not ready" };
      }

      const cleanNumber = to.replace(/\D/g, "");
      const chatId = `${cleanNumber}@c.us`;

      const isRegistered = await whatsappClient.isRegisteredUser(chatId);
      if (!isRegistered) {
        return {
          success: false,
          error: "Number not registered",
        };
      }

      const randomDelay = Math.floor(Math.random() * 3000) + 2000;
      await WhatsappService.delay(randomDelay);

      await whatsappClient.sendMessage(chatId, message);

      return { success: true };
    } catch (error: unknown) {
      console.error("[WA Error]", error);

      let errorMessage = "Unknown Error";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      return { success: false, error: errorMessage };
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default whatsappClient;
