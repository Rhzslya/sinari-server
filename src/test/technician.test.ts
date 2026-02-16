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
  TechnicianResponse,
  UpdateTechnicianRequest,
} from "../model/technician-model";
import { logger } from "../application/logging";
import { prismaClient } from "../application/database";

describe("POST /api/technicians", () => {
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

  it("should create technician successfully if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getCustomer();
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
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getOwner();
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
    const user = await UserTest.getAdmin();
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

  it("should create technician WITH signature image (multipart/form-data)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const formData = new FormData();
    formData.append("name", "Tech With Signature");
    formData.append("is_active", "true");

    const base64Png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const imageBuffer = Buffer.from(base64Png, "base64");

    const dummyImage = new Blob([imageBuffer], { type: "image/png" });
    const file = new File([dummyImage], "signature.png", { type: "image/png" });

    formData.append("signature", file);

    const response = await TestRequest.postMultipart(
      "/api/technicians",
      formData,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Tech With Signature");
    expect(body.data.signature_url).not.toBe("");
  }, 15000);
});

describe("GET /api/technicians/:id", () => {
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

  it("should get technician detail", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const response = await TestRequest.get(`/api/technicians/${99999}`, token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
  });

  it("should get technician detail if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
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
    const user = await UserTest.getCustomer();
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

  it("should return 400 if technician ID is invalid (NaN)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const response = await TestRequest.get(
      `/api/technicians/abc-invalid-id`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBe("Invalid technician ID");
  });
});

describe("PATCH /api/technicians/:id", () => {
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

  it("should update technician name and status", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const tech1 = await TechnicianTest.create();
    const tech2 = await TestRequest.post(
      "/api/technicians",
      { name: "test second" },
      token,
    ).then((res) => res.json());

    const requestBody: UpdateTechnicianRequest = {
      id: tech2.data.id,
      name: "test",
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
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getAdmin();
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
    const user = await UserTest.getOwner();
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

  it("should reject update if user is CUSTOMER (Forbidden)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const requestBody: UpdateTechnicianRequest = {
      id: technician.id,
      name: "Customer Try Update",
    };

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}`,
      requestBody,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should successfully update and UPLOAD NEW signature image (multipart/form-data)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const formData = new FormData();
    formData.append("name", "Tech Name Updated With Image");

    const base64Png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(base64Png, "base64");
    const dummyImage = new Blob([imageBuffer], { type: "image/png" });
    const file = new File([dummyImage], "new-signature.png", {
      type: "image/png",
    });

    formData.append("signature", file);

    const response = await TestRequest.patchMultipart(
      `/api/technicians/${technician.id}`,
      formData,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Tech Name Updated With Image");

    expect(body.data.signature_url).not.toBeNull();
    expect(body.data.signature_url).not.toBe("");
  }, 15000);
});

describe("DELETE /api/technicians/:id", () => {
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

  it("should delete technician successfully (soft delete) if user is ADMIN", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    // Pastikan sekarang menggunakan Soft Delete
    const check = await prismaClient.technician.findUnique({
      where: { id: technician.id },
    });
    expect(check?.deleted_at).not.toBeNull();
    expect(check?.is_active).toBe(false);
  });

  it("should fail to delete if technician has ACTIVE ONGOING services", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    await prismaClient.service.create({
      data: {
        service_id: "SRV-ACTV",
        brand: "OTHER",
        model: "HP",
        customer_name: "Cust",
        phone_number: "081",
        status: "PENDING",
        tracking_token: "t-actv",
        technician_id: technician.id,
        total_price: 10000,
        discount: 0,
      },
    });

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toContain(
      "Cannot delete technician: They still have active ongoing jobs.",
    );
  });

  it("should SUCCESSFULLY delete technician if they only have FINISHED/CANCELLED services", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
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

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);

    const check = await prismaClient.technician.findUnique({
      where: { id: technician.id },
    });
    expect(check?.deleted_at).not.toBeNull();
  });

  it("should delete technician successfully if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const check = await prismaClient.technician.findUnique({
      where: { id: technician.id },
    });
    expect(check?.deleted_at).not.toBeNull();
    expect(check?.is_active).toBe(false);
  });

  it("should reject delete if user is Customer (Forbidden)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should return 404 if technician not found", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const response = await TestRequest.delete(
      `/api/technicians/${99999}`,
      token,
    );

    expect(response.status).toBe(404);
  });

  it("should delete technician and trigger signature image deletion if they have one", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { signature_url: "sinari-cell/technicians/dummy_signature_123" },
    });

    const response = await TestRequest.delete(
      `/api/technicians/${technician.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);

    const check = await prismaClient.technician.findUnique({
      where: { id: technician.id },
    });
    expect(check?.deleted_at).not.toBeNull();
    expect(check?.is_active).toBe(false);
  });
});

describe("GET /api/technicians", () => {
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

  it("should search technicians by name", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
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

    const response = await TestRequest.get(
      "/api/technicians?name=Alpha",
      token,
    );
    const body = await response.json();

    logger.debug(body.data);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toContain("Alpha");
  });

  it("should search technicians by active status", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

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

    const response = await TestRequest.get(
      "/api/technicians?is_active=false",
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    const inactiveData = body.data.data.filter((t: TechnicianResponse) =>
      t.name.includes("test inactive"),
    );
    expect(inactiveData.length).toBe(1);
  });

  it("should support pagination", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    for (let i = 0; i < 15; i++) {
      await TestRequest.post(
        "/api/technicians",
        { name: `test page ${i}` },
        token,
      );
    }

    const response = await TestRequest.get(
      "/api/technicians?page=1&size=10",
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(10);
    expect(body.data.paging.total_page).toBe(2);
  });

  it("should search technicians if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    await TestRequest.post(
      "/api/technicians",
      { name: "Owner Tech test", is_active: true },
      token,
    );

    const response = await TestRequest.get("/api/technicians", token);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("should reject search if user is CUSTOMER (Forbidden)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    const token = user.token!;

    const response = await TestRequest.get("/api/technicians", token);

    expect(response.status).toBe(403);
  });

  it("should sort technicians by name descending", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

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

    const query = new URLSearchParams({
      sort_by: "name",
      sort_order: "desc",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(`/api/technicians?${query}`, token);

    const body = await response.json();

    if (response.status !== 200) {
      console.error("TEST ERROR BODY:", JSON.stringify(body, null, 2));
    }

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBeGreaterThanOrEqual(3);

    const names = body.data.data.map((t: TechnicianResponse) => t.name);

    expect(names[0]).toBe("C_Tech test");
    expect(names[1]).toBe("B_Tech test");
    expect(names[2]).toBe("A_Tech test");
  });
  it("should search technicians by ID (passing number in name query)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    // Buat teknisi
    await TestRequest.post(
      "/api/technicians",
      { name: "test Tech Numeric", is_active: true },
      token,
    );

    const getRes = await TestRequest.get("/api/technicians", token);
    const getBody = await getRes.json();
    const techId = getBody.data.data[0].id;

    const response = await TestRequest.get(
      `/api/technicians?name=${techId}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].id).toBe(techId);
  });

  it("should search ONLY deleted technicians when is_deleted is true", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    await TestRequest.post(
      "/api/technicians",
      { name: "test Active Tech", is_active: true },
      token,
    );

    const tech2Res = await TestRequest.post(
      "/api/technicians",
      { name: "test Deleted Tech", is_active: true },
      token,
    );
    const tech2Body = await tech2Res.json();
    const deletedTechId = tech2Body.data.id;

    await TestRequest.delete(`/api/technicians/${deletedTechId}`, token);

    const response = await TestRequest.get(
      `/api/technicians?is_deleted=true`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test Deleted Tech");
  });
});

describe("GET /api/technicians/active", () => {
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

  it("should return ONLY active technicians", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    await TestRequest.post(
      "/api/technicians",
      { name: "test active tech", is_active: true },
      token,
    );
    await TestRequest.post(
      "/api/technicians",
      { name: "test inactive tech", is_active: false },
      token,
    );

    const response = await TestRequest.get("/api/technicians/active", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe("test active tech");
  });

  it("should sort technicians based on workload (least active jobs first)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const techA = await TechnicianTest.create();

    const techBRes = await TestRequest.post(
      "/api/technicians",
      { name: "Tech B", is_active: true },
      token,
    );
    const techB = (await techBRes.json()).data;

    const techCRes = await TestRequest.post(
      "/api/technicians",
      { name: "Tech C", is_active: true },
      token,
    );
    const techC = (await techCRes.json()).data;

    await prismaClient.service.create({
      data: {
        service_id: "SRV-1",
        brand: "OTHER",
        model: "X",
        customer_name: "C1",
        phone_number: "081",
        status: "PROCESS",
        tracking_token: "t1",
        technician_id: techB.id,
        total_price: 100,
        discount: 0,
      },
    });
    await prismaClient.service.create({
      data: {
        service_id: "SRV-2",
        brand: "OTHER",
        model: "Y",
        customer_name: "C2",
        phone_number: "082",
        status: "PENDING",
        tracking_token: "t2",
        technician_id: techB.id,
        total_price: 100,
        discount: 0,
      },
    });

    await prismaClient.service.create({
      data: {
        service_id: "SRV-3",
        brand: "OTHER",
        model: "Z",
        customer_name: "C3",
        phone_number: "083",
        status: "PENDING",
        tracking_token: "t3",
        technician_id: techC.id,
        total_price: 100,
        discount: 0,
      },
    });

    const response = await TestRequest.get("/api/technicians/active", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(3);

    expect(body.data[0].name).toBe("test");
    expect(body.data[1].name).toBe("Tech C");
    expect(body.data[2].name).toBe("Tech B");
  });

  it("should reject if user is CUSTOMER (Forbidden)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    const token = user.token!;

    const response = await TestRequest.get("/api/technicians/active", token);

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/technicians/:id/restore", () => {
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

  it("should successfully restore a deleted technician if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    const technician = await TechnicianTest.create();
    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { deleted_at: new Date(), is_active: false },
    });

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(technician.id);

    const checkRestored = await prismaClient.technician.findUnique({
      where: { id: technician.id },
    });
    expect(checkRestored?.deleted_at).toBeNull();
  });

  it("should reject restore if technician is NOT in the trash bin (Active Technician)", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    const technician = await TechnicianTest.create();

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toContain(
      "Technician not found in trash bin. It might be active or permanently deleted.",
    );
  });

  it("should reject restore if user is ADMIN (Insufficient Permission)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const technician = await TechnicianTest.create();
    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBe("Forbidden: Insufficient permissions");
  });

  it("should reject restore if user is CUSTOMER (Forbidden)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    const token = user.token!;

    const technician = await TechnicianTest.create();
    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject if target technician is not found at all", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    const randomId = 999999;

    const response = await TestRequest.patch(
      `/api/technicians/${randomId}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject request with invalid token", async () => {
    const technician = await TechnicianTest.create();
    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
      "wrong_token",
    );

    expect(response.status).toBe(401);
  });

  it("should reject request if no token provided", async () => {
    const technician = await TechnicianTest.create();
    await prismaClient.technician.update({
      where: { id: technician.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/technicians/${technician.id}/restore`,
      {},
    );

    expect(response.status).toBe(401);
  });
});
