// file: test/whatsapp.test.ts
import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { TestRequest, UserTest } from "./test-utils";
import { logger } from "../application/logging";

let mockIsConnected = false;
let mockCurrentQR: string | null = null;
let mockIsInitializing = false;

mock.module("../lib/whatsapp", () => {
  return {
    default: {
      initialize: mock(() => Promise.resolve()),
      logout: mock(() => Promise.resolve()),
      isRegisteredUser: mock(() => Promise.resolve(true)),
      sendMessage: mock(() => Promise.resolve()),
      destroy: mock(() => Promise.resolve()),
      info: { pushname: "Sinari Bot" },
    },

    WhatsappService: class MockWhatsappService {
      static getStatus(user: any) {
        if (user.role !== "ADMIN" && user.role !== "OWNER") {
          throw new Error(
            "Forbidden: Only Admin or Owner can access WhatsApp status",
          );
        }
        if (mockIsConnected) return { status: "connected" };
        if (mockCurrentQR)
          return { status: "loading_qr", qr_code: mockCurrentQR };
        if (!mockIsConnected && !mockCurrentQR && !mockIsInitializing) {
          mockIsInitializing = true;
          // Simulasi panggilan initialize
        }
        return { status: "disconnected" };
      }

      static async disconnectDevice(user: any) {
        if (user.role !== "ADMIN" && user.role !== "OWNER") {
          throw new Error(
            "Forbidden: Only Admin or Owner can disconnect WhatsApp",
          );
        }
        if (mockIsConnected) {
          // Simulasi logout
        }
        mockIsConnected = false;
        mockCurrentQR = null;
        return {
          success: true,
          message: "Device successfully disconnected. Generating new QR...",
        };
      }

      static async sendMessage(to: string, message: string) {
        if (!mockIsConnected) {
          return {
            success: false,
            error: "Whatsapp Client not ready or disconnected",
          };
        }
        return { success: true };
      }
    },
  };
});

import { WhatsappService } from "../lib/whatsapp";

describe("WhatsApp API & Service", () => {
  beforeEach(async () => {
    await UserTest.delete();
    // Reset
    mockIsConnected = false;
    mockCurrentQR = null;
    mockIsInitializing = false;
  });

  afterEach(async () => {
    await UserTest.delete();
    mock.restore();
  });

  describe("Service Level: RBAC Validation", () => {
    it("should reject getting status if user is a CUSTOMER", async () => {
      await UserTest.create();
      const customer = await UserTest.getCustomer();

      expect(() => {
        WhatsappService.getStatus(customer);
      }).toThrow("Forbidden: Only Admin or Owner can access WhatsApp status");
    });

    it("should reject disconnecting device if user is a CUSTOMER", async () => {
      await UserTest.create();
      const customer = await UserTest.getCustomer();

      await expect(WhatsappService.disconnectDevice(customer)).rejects.toThrow(
        "Forbidden: Only Admin or Owner can disconnect WhatsApp",
      );
    });

    it("should allow getting status if user is an ADMIN", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();

      const response = WhatsappService.getStatus(admin);
      expect(response).toBeDefined();
    });
  });

  describe("API Routes: GET /api/whatsapp/status", () => {
    it("should return 403 Forbidden for CUSTOMER role", async () => {
      await UserTest.create();
      const customer = await UserTest.getCustomer();
      const token = customer.token!;

      const response = await TestRequest.get("/api/whatsapp/status", token);

      expect(response.status).toBe(403);
    });

    it("should return disconnected status by default for ADMIN", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      mockIsConnected = false;

      const response = await TestRequest.get("/api/whatsapp/status", token);
      const body = await response.json();

      logger.debug("WA Status response (Disconnected):", body);

      expect(response.status).toBe(200);
      expect(body.data.status).toBe("disconnected");
    });

    it("should return connected status if WA client is ready", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      mockIsConnected = true;

      const response = await TestRequest.get("/api/whatsapp/status", token);
      const body = await response.json();

      logger.debug("WA Status response (Connected):", body);

      expect(response.status).toBe(200);
      expect(body.data.status).toBe("connected");
    });
  });

  describe("API Routes: POST /api/whatsapp/disconnect", () => {
    it("should successfully disconnect device for OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      mockIsConnected = true;

      const response = await TestRequest.post(
        "/api/whatsapp/disconnect",
        {},
        token,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.success).toBe(true);
      expect(mockIsConnected).toBe(false);
    });
  });
});
