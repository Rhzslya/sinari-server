import { Client, LocalAuth, type ClientOptions } from "whatsapp-web.js";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";
import type {
  WhatsappDisconnectResponse,
  WhatsappSendResult,
  WhatsappStatusResponse,
} from "../model/whatsapp-model";

const SESSION_PATH = path.join(process.cwd(), ".wwebjs_auth");
const CLIENT_ID = "sinari_v1";

let currentQR: string | null = null;
let isConnected = false;
let isInitializing = false;

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

whatsappClient.on("qr", async (qr) => {
  console.log("[WA] New QR Code generated, waiting for scan...");
  isInitializing = false;
  try {
    currentQR = await qrcode.toDataURL(qr);
    isConnected = false;
  } catch (err) {
    console.error("Failed to generate QR base64", err);
  }
});

whatsappClient.on("authenticated", () => {
  console.log("WhatsApp Authenticated (Session saved!)");
});

whatsappClient.on("ready", () => {
  console.log("[WA] WhatsApp Client is Ready!");
  isConnected = true;
  currentQR = null;
  isInitializing = false;
});

whatsappClient.on("disconnected", async (reason) => {
  console.log("[WA] WhatsApp Client was disconnected", reason);
  isConnected = false;
  currentQR = null;
  isInitializing = true;

  try {
    await whatsappClient.destroy();
  } catch (error) {
    // Abaikan jika sudah terlanjur hancur
  }

  setTimeout(() => {
    whatsappClient.initialize().catch((e) => {
      console.error(e);
      isInitializing = false;
    });
  }, 5000);
});

whatsappClient.on("auth_failure", (msg) => {
  console.error("WA Auth Failure:", msg);
  isConnected = false;
  currentQR = null;
});

isInitializing = true;
whatsappClient.initialize().catch((e) => {
  console.error(e);
  isInitializing = false;
});

export class WhatsappService {
  static getStatus(): WhatsappStatusResponse {
    if (isConnected) {
      return { status: "connected" };
    }

    if (currentQR) {
      return { status: "loading_qr", qr_code: currentQR };
    }

    if (!isConnected && !currentQR && !isInitializing) {
      console.log("[WA] Status is disconnected, waking up client...");
      isInitializing = true;
      whatsappClient.initialize().catch((err) => {
        console.log("[WA Fix] Init error:", err);
        isInitializing = false;
      });
    }
    return { status: "disconnected" };
  }

  static async disconnectDevice(): Promise<WhatsappDisconnectResponse> {
    try {
      if (isConnected) {
        await whatsappClient.logout();
      }
      isConnected = false;
      currentQR = null;

      return {
        success: true,
        message: "Device successfully disconnected. Generating new QR...",
      };
    } catch (error) {
      console.error("Logout Error:", error);
      return {
        success: false,
        message: "Failed to disconnect device.",
      };
    }
  }

  static async sendMessage(
    to: string,
    message: string,
  ): Promise<WhatsappSendResult> {
    try {
      if (!isConnected || !whatsappClient.info) {
        return {
          success: false,
          error: "Whatsapp Client not ready or disconnected",
        };
      }

      const cleanNumber = to.replace(/\D/g, "");
      const chatId = `${cleanNumber}@c.us`;

      const isRegistered = await whatsappClient.isRegisteredUser(chatId);
      if (!isRegistered) {
        return {
          success: false,
          error: "Number not registered on WhatsApp",
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
