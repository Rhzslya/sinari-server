import { describe, afterEach, it, expect } from "bun:test";
import {
  ProductLogTest,
  ProductTest,
  ServiceLogTest,
  ServiceTest,
  TechnicianTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import { prismaClient } from "../application/database";
import { redis } from "../lib/redis";
import { logger } from "../application/logging";
import {
  ProductLogAction,
  ServiceLogAction,
} from "../../generated/prisma/client";

describe.only("Dashboard API", () => {
  afterEach(async () => {
    await redis.del("dashboard:stats:global");

    await ProductLogTest.delete();
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await ProductTest.delete();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  describe("GET /api/dashboard/stats", () => {
    it("should get dashboard stats successfully if user is ADMIN (Empty Data Fallback)", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      const response = await TestRequest.get("/api/dashboard/stats", token);
      const body = await response.json();
      logger.debug("Dashboard Stats (Empty):", body);

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data.cards.total_revenue).toBe(0);
      expect(body.data.cards.profit).toBe(0);
      expect(body.data.cards.active_services).toBe(0);
      expect(body.data.cards.pending_queue).toBe(0);
      expect(body.data.cards.finished_jobs).toBe(0);
      expect(body.data.cards.products_sold).toBe(0);

      expect(body.data.chart_data.length).toBe(12);
      expect(body.data.recent_activity.length).toBe(0);
    });

    it("should calculate stats correctly when data exists and user is OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const product = await ProductTest.create();
      const service = await ServiceTest.create();

      await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.SALE_OFFLINE,
          quantity_change: -2,
          total_revenue: 20000,
          total_profit: 4000,
          description: "Sold 2 items",
        },
      });

      await prismaClient.service.update({
        where: { id: service.id },
        data: { status: "FINISHED", total_price: 150000 },
      });

      await prismaClient.serviceLog.create({
        data: {
          service_id: service.id,
          user_id: owner.id,
          action: ServiceLogAction.UPDATE_STATUS,
          description: "Service completed",
        },
      });

      const response = await TestRequest.get("/api/dashboard/stats", token);
      const body = await response.json();
      logger.debug("Dashboard Stats (Populated):", body);

      expect(response.status).toBe(200);

      expect(body.data.cards.total_revenue).toBe(170000);
      expect(body.data.cards.profit).toBe(154000);

      expect(body.data.cards.finished_jobs).toBe(1);
      expect(body.data.cards.products_sold).toBe(2);

      expect(body.data.recent_activity.length).toBe(2);
      expect(body.data.recent_activity[0].type).toBeDefined();
    });

    it("should hit REDIS CACHE on the second request", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      const response1 = await TestRequest.get("/api/dashboard/stats", token);
      expect(response1.status).toBe(200);

      const response2 = await TestRequest.get("/api/dashboard/stats", token);
      const body2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(body2.data).toBeDefined();
    });

    it("should reject getting stats if user is CUSTOMER (403 Forbidden)", async () => {
      await UserTest.create();
      const customer = await UserTest.getCustomer();
      const token = customer.token!;

      const response = await TestRequest.get("/api/dashboard/stats", token);

      expect(response.status).toBe(403);
    });

    it("should reject if no token is provided (401 Unauthorized)", async () => {
      const response = await TestRequest.get("/api/dashboard/stats"); // Tanpa token

      expect(response.status).toBe(401);
    });
  });
});
