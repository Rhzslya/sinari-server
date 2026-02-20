import { describe, afterEach, it, expect } from "bun:test";
import {
  ServiceLogTest,
  ServiceTest,
  TechnicianTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";

describe("Repair/Service Log API", () => {
  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  describe("GET /api/services/:id/logs", () => {
    it("should get service logs successfully if user is OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const service = await ServiceTest.create();

      await prismaClient.serviceLog.create({
        data: {
          service_id: service.id,
          user_id: owner.id,
          action: "CREATED",
          description: "Customer brought the device.",
        },
      });

      await prismaClient.serviceLog.create({
        data: {
          service_id: service.id,
          user_id: owner.id,
          action: "UPDATE_INFO",
          description: "Technician checked the device.",
        },
      });

      const response = await TestRequest.get(
        `/api/services/${service.id}/logs`,
        token,
      );
      const body = await response.json();
      logger.debug("Service Logs Response:", body);

      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);

      expect(body.data[0].action).toBe("UPDATE_INFO");
      expect(body.data[1].action).toBe("CREATED");

      expect(body.data[0].user).toBeDefined();
      expect(body.data[0].user.username).toBe("test_owner");
    });

    it("should reject getting logs if user is ADMIN (403 Forbidden)", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      const service = await ServiceTest.create();

      const response = await TestRequest.get(
        `/api/services/${service.id}/logs`,
        token,
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
      expect(body.errors).toContain("Forbidden");
    });

    it("should reject getting logs if user is CUSTOMER (403 Forbidden)", async () => {
      await UserTest.create();
      const customer = await UserTest.getCustomer();
      const token = customer.token!;

      const service = await ServiceTest.create();

      const response = await TestRequest.get(
        `/api/services/${service.id}/logs`,
        token,
      );

      expect(response.status).toBe(403);
    });

    it("should return 404 Not Found if service does not exist", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const response = await TestRequest.get(
        `/api/services/999999/logs`,
        token,
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.errors).toBeDefined();
    });
  });
});
