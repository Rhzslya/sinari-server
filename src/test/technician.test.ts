import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { TechnicianTest, TestRequest, UserTest } from "./test-utils";
import type {
  CreateTechnicianRequest,
  UpdateTechnicianRequest,
} from "../model/technician-model";
import { logger } from "../application/logging";

describe("Technician API", () => {
  beforeEach(async () => {
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  afterEach(async () => {
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  // --- CREATE TESTS ---
  describe("POST /api/technicians", () => {
    it("should create technician successfully if user is admin", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const requestBody: CreateTechnicianRequest = {
        name: "test technician",
        is_active: true,
      };

      const response = await TestRequest.post(
        "/api/technicians",
        requestBody,
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.name).toBe("test technician");
      expect(body.data.is_active).toBe(true);
    });

    it("should reject creation if user is customer (Forbidden)", async () => {
      await UserTest.create();
      const user = await UserTest.get();
      const token = user.token!;

      const requestBody: CreateTechnicianRequest = {
        name: "test technician",
      };

      const response = await TestRequest.post(
        "/api/technicians",
        requestBody,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(403);
    });

    it("should reject if name is empty", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const requestBody = {
        name: "", // Invalid
        is_active: true,
      };

      const response = await TestRequest.post(
        "/api/technicians",
        requestBody,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(400);
    });
  });

  // --- GET TESTS ---
  describe("GET /api/technicians/:id", () => {
    it("should get technician detail", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      const response = await TestRequest.get(
        `/api/technicians/${technician.id}`,
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.id).toBe(technician.id);
      expect(body.data.name).toBe(technician.name);
    });

    it("should return 404 if technician not found", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const response = await TestRequest.get(
        `/api/technicians/${99999}`,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(404);
    });
  });

  // --- UPDATE TESTS ---
  describe("PATCH /api/technicians/:id", () => {
    it("should update technician name and status", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create(); // name: "test"

      const requestBody: UpdateTechnicianRequest = {
        id: technician.id,
        name: "test technician updated",
        is_active: false,
      };

      const response = await TestRequest.patch(
        `/api/technicians/${technician.id}`,
        requestBody,
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.name).toBe("test technician updated");
      expect(body.data.is_active).toBe(false);
    });

    it("should fail to update if name already used by another technician", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      // Create 2 technicians
      const tech1 = await TechnicianTest.create(); // name: "test"
      // Manual create second one to ensure different ID but known name
      const tech2 = await TestRequest.post(
        "/api/technicians",
        { name: "test second" },
        token,
      ).then((res) => res.json());

      // Try to rename tech2 to "test" (tech1's name)
      const requestBody: UpdateTechnicianRequest = {
        id: tech2.data.id,
        name: "test", // Conflict!
      };

      const response = await TestRequest.patch(
        `/api/technicians/${tech2.data.id}`,
        requestBody,
        token,
      );

      expect(response.status).toBe(400);
      const body = await response.json();

      logger.debug(body);
      expect(body.errors).toBeDefined();
    });

    it("should return 404 if updating non-existent technician", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const response = await TestRequest.patch(
        `/api/technicians/${99999}`,
        { name: "test ghost" },
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(404);
    });
  });

  // --- DELETE TESTS ---
  describe("DELETE /api/technicians/:id", () => {
    it("should delete technician", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      const response = await TestRequest.delete(
        `/api/technicians/${technician.id}`,
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.message).toBe(
        `Technician With ID ${technician.id} deleted successfully`,
      );
    });
  });

  // --- SEARCH TESTS ---
  describe("GET /api/technicians", () => {
    it("should search technicians by name", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      // Create dummy data
      await TestRequest.post("/api/technicians", { name: "test alpha" }, token);
      await TestRequest.post("/api/technicians", { name: "test beta" }, token);
      await TestRequest.post("/api/technicians", { name: "gamma" }, token);

      // Search "test"
      const response = await TestRequest.get(
        "/api/technicians?name=test",
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.length).toBe(2); // alpha & beta
      expect(body.paging.total_page).toBeGreaterThanOrEqual(1);
    });

    it("should search technicians by active status", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      // Create active and inactive
      await TestRequest.post(
        "/api/technicians",
        { name: "test active", is_active: true },
        token,
      );
      await TestRequest.post(
        "/api/technicians",
        { name: "test inactive", is_active: false },
        token,
      );

      // Search active=false
      const response = await TestRequest.get(
        "/api/technicians?is_active=false",
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      const inactiveData = body.data.filter((t: any) =>
        t.name.includes("test inactive"),
      );
      expect(inactiveData.length).toBe(1);
    });

    it("should support pagination", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      // Create 15 items
      for (let i = 0; i < 15; i++) {
        await TestRequest.post(
          "/api/technicians",
          { name: `test page ${i}` },
          token,
        );
      }

      // Page 1, size 10
      const response = await TestRequest.get(
        "/api/technicians?page=1&size=10",
        token,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.length).toBe(10);
      expect(body.paging.total_page).toBe(2);
    });
  });
});
