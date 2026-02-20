import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import {
  ServiceLogTest,
  ServiceTest,
  TechnicianTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../model/repair-model";
import { logger } from "../application/logging";
import { prismaClient } from "../application/database";

describe("POST /api/services", () => {
  beforeEach(async () => {
    // await UserTest.create();
  });

  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should create service", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [
        {
          name: "test",
          price: 1000,
        },
      ],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("OTHER");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("628123123123");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.technician.id).toBe(technician.id);
    expect(body.data.service_list[0].price).toBe(1000);
  });

  it("should create service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [
        {
          name: "test",
          price: 1000,
        },
      ],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("OTHER");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("628123123123");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.technician.id).toBe(technician.id);
  });

  it("should create service if service list is multiple", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [
        {
          name: "test",
          price: 1000,
        },
        {
          name: "test2",
          price: 10000,
        },
      ],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("OTHER");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("628123123123");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].name).toBe("test2");
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_items).toBe(2);
    expect(body.data.discount).toBe(0);
    expect(body.data.total_price).toBe(11000);
    expect(body.data.technician.id).toBe(technician.id);
  });

  it("should create service if service list is multiple and have discount", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [
        {
          name: "test",
          price: 1000,
        },
        {
          name: "test2",
          price: 10000,
        },
      ],
      discount: 10,
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("OTHER");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("628123123123");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].name).toBe("test2");
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_items).toBe(2);
    expect(body.data.discount).toBe(10);
    expect(body.data.total_price).toBe(9900);
    expect(body.data.technician.id).toBe(technician.id);
  });

  it("should create service even if optional fields are missing", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "Simple User",
      phone_number: "08123123123",
      service_list: [{ name: "Fix", price: 1000 }],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.discount).toBe(0);
    expect(body.data.status).toBe("PENDING");
    expect(body.data.description).toBeNull();
    expect(body.data.technician_note).toBeNull();
    expect(body.data.technician.id).toBe(technician.id);
  });

  it("should reject create service if service list is empty", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if token login is invalid", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if discount is invalid (negative or > 100)", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      service_list: [{ name: "Service 1", price: 10000 }],
      discount: 150,
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if service price is negative", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      service_list: [
        {
          name: "Ganti LCD",
          price: -50000,
        },
      ],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if required fields are empty strings", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "",
      customer_name: "Valid Name",
      phone_number: "08123123123",
      service_list: [{ name: "Fix", price: 1000 }],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if user is not admin", async () => {
    await UserTest.create();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      description: "test",
      technician_note: "test",
      service_list: [
        {
          name: "test",
          price: 1000,
        },
      ],
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.errors).toContain("Forbidden");
  });

  it("should reject create service if technician_id is invalid", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "628123123123",
      technician_id: technician.id + 1,
      service_list: [
        {
          name: "test",
          price: 1000,
        },
      ],
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toContain("Invalid technician ID");
  });

  it("should reject create service if assigned technician is inactive", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const inactiveTechnician = await prismaClient.technician.create({
      data: {
        name: "test",
        is_active: false,
      },
    });

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      service_list: [{ name: "Fix", price: 1000 }],
      technician_id: inactiveTechnician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toContain("inactive technician");
  });

  it("should reject create service if down payment exceeds total price", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123",
      service_list: [{ name: "Service A", price: 100000 }],
      down_payment: 150000,
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should create service if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const technician = await TechnicianTest.create();

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "08123123123",
      service_list: [{ name: "Service A", price: 100000 }],
      down_payment: 50000,
      technician_id: technician.id,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
  });

  it("should reject create service if technician_id is missing (mandatory)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: Omit<CreateServiceRequest, "technician_id"> = {
      brand: "OTHER",
      model: "test No Tech",
      customer_name: "test No Tech",
      phone_number: "08123456789",
      service_list: [{ name: "Cek kerusakan", price: 50000 }],
    };

    const response = await TestRequest.post<
      Omit<CreateServiceRequest, "technician_id">
    >("/api/services", requestBody, token);

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";
  it("should get service by id if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should get service by id if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should reject get service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should get service by id if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should return 404 if service id is not found", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.get(`/api/services/${999999}`, token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject get service if token is invalid (Unauthorized)", async () => {
    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      "wrong_token_123",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/public/services/track/:token", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
  });

  it("should get service by token", async () => {
    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/public/services/track/${service.tracking_token}`,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
  });

  it("should reject service if token is invalid", async () => {
    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/public/services/track/${service.tracking_token + "wrong"}`,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
  });

  it("should get service by service_id", async () => {
    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/public/services/track/${service.service_id}`,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.service_id).toBe(service.service_id);
  });

  it("should return 404 if service is already deleted (in trash)", async () => {
    const service = await ServiceTest.create();

    await prismaClient.service.update({
      where: { id: service.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.get(
      `/api/public/services/track/${service.tracking_token}`,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toContain("Service not found");
  });

  it("should reject and return 404 if identifier is invalid", async () => {
    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/public/services/track/${service.tracking_token + "wrong"}`,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";
  it("should patch service if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.status).toBe("PROCESS");
    expect(body.data.data.technician_note).toBe("Fixing...");
  });

  it("should patch service list and recalculate total price", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      service_list: [
        {
          name: "test",
          price: 1000,
        },
        {
          name: "test2",
          price: 10000,
        },
      ],
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.service_list[0].price).toBe(1000);
    expect(body.data.data.service_list[1].price).toBe(10000);
    expect(body.data.data.total_price).toBe(11000);
  });

  it("should patch service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.status).toBe("PROCESS");
    expect(body.data.data.technician_note).toBe("Fixing...");
  });

  it("should change technician successfully", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const oldTech = await prismaClient.technician.create({
      data: {
        name: "test old technician",
        is_active: true,
      },
    });

    const newTech = await prismaClient.technician.create({
      data: {
        name: "New Technician",
        is_active: true,
      },
    });

    const service = await prismaClient.service.create({
      data: {
        service_id: "SRV-CHANGE-TECH",
        brand: "OTHER",
        model: "Test Model",
        customer_name: "Test Customer",
        phone_number: "08123456789",
        status: "PENDING",
        tracking_token: "token-change-tech",
        technician_id: oldTech.id,
      },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      technician_id: newTech.id,
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.data.data.technician).toBeDefined();
    expect(body.data.data.technician.id).toBe(newTech.id);
    expect(body.data.data.technician.name).toBe("New Technician");

    const updatedServiceFromDB = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(updatedServiceFromDB?.technician_id).toBe(newTech.id);
  });

  it("should reject patch service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject patch service if service id is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id + 10}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject update if service is already TAKEN (Strict Lock)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { status: "TAKEN" },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      description: "Trying to sneak an update",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toContain("Service is already TAKEN");
  });

  it("should reject reverting status from FINISHED to PENDING", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { status: "FINISHED" },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PENDING",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toContain(
      "Fraud Prevention: Service is already FINISHED (Grace period expired). Status locked (can only change to TAKEN).",
    );
  });

  it("should reject changing financials if service is FINISHED", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { status: "FINISHED" },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      discount: 50,
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject update if down payment exceeds total price", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      down_payment: 500000,
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject changing to an inactive technician", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const inactiveTech = await prismaClient.technician.create({
      data: { name: "test", is_active: false },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      technician_id: inactiveTech.id,
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should create logs when updating service", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Checking...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    expect(response.status).toBe(200);

    const logs = await prismaClient.serviceLog.findMany({
      where: { service_id: service.id },
      orderBy: { created_at: "desc" },
    });

    expect(logs.length).toBeGreaterThan(0);

    const latestLog = logs[0];
    expect(latestLog.action).toBe("UPDATE_STATUS");
    expect(latestLog.description).toContain("Status: PENDING -> PROCESS");
  });

  it("should reject update if service is in the trash (deleted_at is not null)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    await prismaClient.service.update({
      where: { id: service.id },
      data: { deleted_at: new Date() },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      description: "Trying to update from trash",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should execute standard update WITHOUT creating logs if no trackable changes are made", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    await prismaClient.serviceLog.deleteMany({
      where: { service_id: service.id },
    });

    const requestBody: UpdateServiceRequest = {
      id: service.id,
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      token,
    );

    expect(response.status).toBe(200);

    const logs = await prismaClient.serviceLog.findMany({
      where: { service_id: service.id },
    });

    expect(logs.length).toBe(0);
  });
});

describe("DELETE /api/services/:id", () => {
  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should REJECT delete service if user is ADMIN", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toContain("Forbidden");

    const checkService = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(checkService).not.toBeNull();
  });

  it("should REJECT delete service if user is ADMIN GOOGLE", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete service if user is not admin (User Biasa)", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete service if service id is invalid", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id + 9999}`,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete service if token is invalid", async () => {
    await UserTest.createOwner();
    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      "wrong_token",
    );

    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should SUCCESSFULLY delete service if user is OWNER and status is TAKEN/CANCELLED", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { status: "TAKEN" },
    });

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);

    const checkService = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(checkService?.deleted_at).not.toBeNull();

    const logs = await prismaClient.serviceLog.findMany({
      where: { service_id: service.id, action: "DELETED" },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].description).toContain("trash");
  });

  it("should REJECT delete service if status is still active (e.g., PENDING or PROCESS)", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toContain("Cannot delete active service");

    const checkService = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(checkService?.deleted_at).toBeNull();
  });
});

describe("GET /api/services", () => {
  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should search service if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", token);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBeGreaterThan(0);
  });

  it("should search service if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service using model", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      model: "te",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service using customer name", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      customer_name: "st",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service using phone number", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      phone_number: "08123",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service using status", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      status: "pending",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service filter by price range", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const technician = await TechnicianTest.create();

    await prismaClient.service.create({
      data: {
        service_id: "SRV-CHEAP",
        brand: "OTHER",
        model: "Cheap Phone",
        customer_name: "A",
        phone_number: "081",
        status: "PENDING",
        tracking_token: "t1",
        technician_id: technician.id,
        total_price: 10000,
        discount: 0,
      },
    });

    await prismaClient.service.create({
      data: {
        service_id: "SRV-EXPENSIVE",
        brand: "OTHER",
        model: "Expensive Phone",
        customer_name: "B",
        phone_number: "082",
        status: "PENDING",
        tracking_token: "t2",
        technician_id: technician.id,
        total_price: 1000000,
        discount: 0,
      },
    });

    const queryParams = new URLSearchParams({
      min_price: "500000",
      max_price: "2000000",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].total_price).toBe(1000000);
  });

  it("should search service filter by Brand", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const technician = await TechnicianTest.create();

    await prismaClient.service.create({
      data: {
        service_id: "SRV-SAMSUNG",
        brand: "SAMSUNG",
        model: "S24",
        customer_name: "A",
        phone_number: "081",
        status: "PENDING",
        tracking_token: "t1",
        technician_id: technician.id,
        total_price: 0,
        discount: 0,
      },
    });

    await prismaClient.service.create({
      data: {
        service_id: "SRV-APPLE",
        brand: "APPLE",
        model: "iPhone 15",
        customer_name: "B",
        phone_number: "082",
        status: "PENDING",
        tracking_token: "t2",
        technician_id: technician.id,
        total_price: 0,
        discount: 0,
      },
    });

    const queryParams = new URLSearchParams({
      brand: "SAMSUNG",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].brand).toBe("SAMSUNG");
  });

  it("should search service by technician name (global search)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const tech = await prismaClient.technician.create({
      data: { name: "test", is_active: true },
    });

    await prismaClient.service.create({
      data: {
        service_id: "SRV-TECH-SEARCH",
        brand: "OTHER",
        model: "Phone",
        customer_name: "Customer A",
        phone_number: "081",
        status: "PENDING",
        tracking_token: "t1",
        technician_id: tech.id,
        total_price: 0,
        discount: 0,
      },
    });

    const queryParams = new URLSearchParams({
      customer_name: "test",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].technician.name).toBe("test");
  });

  it("should search service using page", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(1);
    expect(body.data.paging.size).toBe(10);
  });

  it("should search service if no result", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      model: "wrong",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(0);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(0);
    expect(body.data.paging.size).toBe(10);
  });

  it("should support multiple sort", async () => {
    await UserTest.createAdminGoogle();
    const technician = await TechnicianTest.create();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await prismaClient.service.create({
      data: {
        service_id: "SRV-125",
        brand: "OTHER",
        model: "test",
        customer_name: "test",
        phone_number: "08123123123",
        description: "test",
        technician_note: "test",
        status: "PENDING",
        service_list: {
          create: [
            {
              name: "test",
              price: 1000,
            },
            {
              name: "test2",
              price: 10000,
            },
          ],
        },
        discount: 0,
        total_price: 11000,
        tracking_token: "test_token1",
        technician_id: technician.id,
      },
    });

    await prismaClient.service.create({
      data: {
        service_id: "SRV-123",
        brand: "OTHER",
        model: "test",
        customer_name: "test",
        phone_number: "08123123123",
        description: "test",
        technician_note: "test",
        status: "PENDING",
        service_list: {
          create: [
            {
              name: "test",
              price: 1000,
            },
            {
              name: "test2",
              price: 10000,
            },
          ],
        },
        discount: 0,
        total_price: 11000,
        tracking_token: "test_token2",
        technician_id: technician.id,
      },
    });

    const queryParams = new URLSearchParams({
      sort_by: "total_price",
      sort_order: "desc",
      page: "1",
      size: "10",
      created_at: "desc",
    });

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(2);
  });

  it("should reject search service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      brand: "wrong",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should search ONLY deleted services when is_deleted is true", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const serviceToDelete = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: serviceToDelete.id },
      data: { deleted_at: new Date() },
    });

    const queryParams = new URLSearchParams({
      is_deleted: "true",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].id).toBe(serviceToDelete.id);
  });
});

describe("PATCH /api/services/:id/restore", () => {
  afterEach(async () => {
    await ServiceLogTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should successfully restore a deleted service if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/services/${service.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);

    const checkRestored = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(checkRestored?.deleted_at).toBeNull();

    const logs = await prismaClient.serviceLog.findMany({
      where: { service_id: service.id, action: "RESTORED" },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].description).toContain("restored from trash bin");
  });

  it("should reject restore if service is NOT in the trash bin (Active Service)", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.patch(
      `/api/services/${service.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toContain("Service not found in trash bin");
  });

  it("should reject restore if user is ADMIN (Insufficient Permission)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/services/${service.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toContain("Insufficient permissions");
  });

  it("should return 404 if service id does not exist", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const response = await TestRequest.patch(
      `/api/services/999999/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject restore if token is invalid", async () => {
    const service = await ServiceTest.create();
    await prismaClient.service.update({
      where: { id: service.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/services/${service.id}/restore`,
      {},
      "invalid_token",
    );

    expect(response.status).toBe(401);
  });
});
