import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import {
  ServiceLogTest,
  ServiceTest,
  TechnicianTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import type {
  CreateTechnicianRequest,
  UpdateTechnicianRequest,
} from "../model/technician-model";
import { logger } from "../application/logging";
import { prismaClient } from "../application/database";

describe("Technician API", () => {
  beforeEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
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

    it("should create technician successfully if user is OWNER", async () => {
      await UserTest.createOwner();
      const user = await UserTest.get();
      const token = user.token!;

      const requestBody: CreateTechnicianRequest = {
        name: "Owner's Technician test",
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
      expect(body.data.name).toBe("Owner's Technician test");
    });

    it("should create technician with special characters in name", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const requestBody: CreateTechnicianRequest = {
        name: "Tech @!#$ Cool 123 test",
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
      expect(body.data.name).toBe("Tech @!#$ Cool 123 test");
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

    it("should get technician detail if user is OWNER", async () => {
      await UserTest.createOwner();
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
    });

    it("should reject if user is not admin/owner (Forbidden)", async () => {
      await UserTest.create();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      const response = await TestRequest.get(
        `/api/technicians/${technician.id}`,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
    });

    it("should reject if token is invalid", async () => {
      await UserTest.createAdmin();
      const technician = await TechnicianTest.create();

      const response = await TestRequest.get(
        `/api/technicians/${technician.id}`,
        "wrong_token_123",
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(401);
      expect(body.errors).toBeDefined();
    });
  });

  // --- UPDATE TESTS ---
  describe("PATCH /api/technicians/:id", () => {
    it("should update technician name and status", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

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

      expect(response.status).toBe(409);
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

    it("should reject deactivation if technician has ONGOING services", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      await prismaClient.service.create({
        data: {
          service_id: "SRV-ACTIVE",
          brand: "OTHER",
          model: "Test HP",
          customer_name: "Customer",
          phone_number: "081",
          status: "PROCESS",
          tracking_token: "t-active",
          technician_id: technician.id,
          total_price: 10000,
          discount: 0,
        },
      });

      const requestBody: UpdateTechnicianRequest = {
        id: technician.id,
        is_active: false,
      };

      const response = await TestRequest.patch(
        `/api/technicians/${technician.id}`,
        requestBody,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(400);
      expect(body.errors).toContain("Technician has ongoing services");
    });

    it("should allow deactivation if all services are FINISHED", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      await prismaClient.service.create({
        data: {
          service_id: "SRV-DONE",
          brand: "OTHER",
          model: "Test HP",
          customer_name: "Customer",
          phone_number: "081",
          status: "FINISHED",
          tracking_token: "t-done",
          technician_id: technician.id,
          total_price: 10000,
          discount: 0,
        },
      });

      const requestBody: UpdateTechnicianRequest = {
        id: technician.id,
        is_active: false,
      };

      const response = await TestRequest.patch(
        `/api/technicians/${technician.id}`,
        requestBody,
        token,
      );

      expect(response.status).toBe(200);
    });

    it("should delete signature image", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await prismaClient.technician.create({
        data: {
          name: "Tech with Image",
          is_active: true,
          signature_url: "http://cloudinary.com/dummy.jpg",
        },
      });

      const requestBody: UpdateTechnicianRequest = {
        id: technician.id,
        delete_image: true,
      };

      const response = await TestRequest.patch(
        `/api/technicians/${technician.id}`,
        requestBody,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.signature_url).toBeNull();
    });

    it("should update technician if user is OWNER", async () => {
      await UserTest.createOwner();
      const user = await UserTest.get();
      const token = user.token!;
      const technician = await TechnicianTest.create();

      const response = await TestRequest.patch(
        `/api/technicians/${technician.id}`,
        { id: technician.id, name: "Owner Updated" },
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.name).toBe("Owner Updated");
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

    it("should fail to delete if technician has ANY services (history constraint)", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      await prismaClient.service.create({
        data: {
          service_id: "SRV-HIST",
          brand: "OTHER",
          model: "HP",
          customer_name: "Cust",
          phone_number: "081",
          status: "FINISHED",
          tracking_token: "t-hist",
          technician_id: technician.id,
          total_price: 10000,
          discount: 0,
        },
      });

      // 2. Coba Hapus
      const response = await TestRequest.delete(
        `/api/technicians/${technician.id}`,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(400);
      expect(body.errors).toContain("Technician has services");
    });

    it("should delete technician successfully if user is OWNER", async () => {
      await UserTest.createOwner();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      const response = await TestRequest.delete(
        `/api/technicians/${technician.id}`,
        token,
      );

      const body = await response.json();

      expect(response.status).toBe(200);

      const check = await prismaClient.technician.findUnique({
        where: { id: technician.id },
      });
      expect(check).toBeNull();
    });

    it("should reject delete if user is Customer (Forbidden)", async () => {
      await UserTest.create();
      const user = await UserTest.get();
      const token = user.token!;

      const technician = await TechnicianTest.create();

      const response = await TestRequest.delete(
        `/api/technicians/${technician.id}`,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(403);
    });

    it("should return 404 if technician not found", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      const response = await TestRequest.delete(
        `/api/technicians/${99999}`,
        token,
      );

      expect(response.status).toBe(404);
    });
  });

  // --- SEARCH TESTS ---
  describe("GET /api/technicians", () => {
    it("should search technicians by name", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      await TestRequest.post(
        "/api/technicians",
        { name: "test Technician Alpha", is_active: true },
        token,
      );
      await TestRequest.post(
        "/api/technicians",
        { name: "test Technician Beta", is_active: true },
        token,
      );
      await TestRequest.post(
        "/api/technicians",
        { name: "test Technician Gamma", is_active: true },
        token,
      );

      // Search "Alpha"
      const response = await TestRequest.get(
        "/api/technicians?name=Alpha",
        token,
      );
      const body = await response.json();

      logger.debug(body.data);

      expect(response.status).toBe(200);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toContain("Alpha");
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

    it("should search technicians if user is OWNER", async () => {
      await UserTest.createOwner();
      const user = await UserTest.get();
      const token = user.token!;

      await TestRequest.post(
        "/api/technicians",
        { name: "Owner Tech test", is_active: true },
        token,
      );

      const response = await TestRequest.get("/api/technicians", token);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should reject search if user is CUSTOMER (Forbidden)", async () => {
      await UserTest.create(); // User biasa
      const user = await UserTest.get();
      const token = user.token!;

      const response = await TestRequest.get("/api/technicians", token);

      expect(response.status).toBe(403);
    });

    it.only("should sort technicians by name descending", async () => {
      await UserTest.createAdmin();
      const user = await UserTest.get();
      const token = user.token!;

      // Kita buat data dengan prefix unik agar mudah di-debug
      // Tapi karena ada afterEach, data ini akan otomatis dihapus setelah test selesai
      await TestRequest.post(
        "/api/technicians",
        { name: "A_Tech test", is_active: true },
        token,
      );
      await TestRequest.post(
        "/api/technicians",
        { name: "B_Tech test", is_active: true },
        token,
      );
      await TestRequest.post(
        "/api/technicians",
        { name: "C_Tech test", is_active: true },
        token,
      );

      // Query Params
      const query = new URLSearchParams({
        sort_by: "name",
        sort_order: "desc",
        page: "1", // Jangan lupa kirim page & size jika validasi mewajibkannya
        size: "10",
      }).toString();

      const response = await TestRequest.get(
        `/api/technicians?${query}`,
        token,
      );

      const body = await response.json();

      // Debugging: Lihat errornya jika masih 400
      if (response.status !== 200) {
        console.error("TEST ERROR BODY:", JSON.stringify(body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(3);

      const names = body.data
        .map((t: any) => t.name)
        .filter((n: string) => n.includes("_Tech test"));

      expect(names[0]).toBe("C_Tech test");
      expect(names[1]).toBe("B_Tech test");
      expect(names[2]).toBe("A_Tech test");
    });
  });
});

describe("GET /api/technicians/active", () => {
  afterEach(async () => {
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  it("should return active technicians", async () => {
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

    const response = await TestRequest.get("/api/technicians/active", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
  });
});
