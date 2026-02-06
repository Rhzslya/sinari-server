import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import {
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
    await UserTest.delete();
    await ServiceTest.deleteAll();
    await TechnicianTest.delete();
  });

  let token = "";

  it("should create service", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.get();
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    expect(body.data.phone_number).toBe("62");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.technician.id).toBe(technician.id);
  });

  it("should create service if service list is multiple", async () => {
    await UserTest.createAdmin();
    const technician = await TechnicianTest.create();
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    expect(body.data.phone_number).toBe("62");
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    expect(body.data.phone_number).toBe("62");
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "Simple User",
      phone_number: "08123",
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
      phone_number: "test",
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "",
      customer_name: "Valid Name",
      phone_number: "08123",
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
    const user = await UserTest.get();
    token = user.token!;

    const requestBody: CreateServiceRequest = {
      brand: "OTHER",
      model: "test",
      customer_name: "test",
      phone_number: "test",
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
    const user = await UserTest.get();
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
});

describe("GET /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await UserTest.delete();
  });

  let token = "";
  it("should get service by id if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
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
    const user = await UserTest.get();
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
    const user = await UserTest.get();
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

  it("should reject get service if service id is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id + 1}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/public/services/track/:token", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
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
});

describe("PATCH /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await UserTest.delete();
  });

  let token = "";
  it("should patch service if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
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
    expect(body.data.status).toBe("PROCESS");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should patch service list and recalculate total price", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
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
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_price).toBe(11000);
  });

  it("should patch service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.status).toBe("PROCESS");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should change technician successfully", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
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

    expect(body.data.technician).toBeDefined();
    expect(body.data.technician.id).toBe(newTech.id);
    expect(body.data.technician.name).toBe("New Technician");

    const updatedServiceFromDB = await prismaClient.service.findUnique({
      where: { id: service.id },
    });
    expect(updatedServiceFromDB?.technician_id).toBe(newTech.id);
  });

  it("should reject patch service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.get();
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
    const user = await UserTest.get();
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
});

describe("DELETE /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await UserTest.delete();
  });

  let token = "";
  it("should delete service if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const checkService = await prismaClient.service.findUnique({
      where: {
        id: service.id,
      },
    });

    expect(checkService).toBeNull();
  });

  it("should delete service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const checkService = await prismaClient.service.findUnique({
      where: {
        id: service.id,
      },
    });

    expect(checkService).toBeNull();
  });

  it("should reject delete service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.get();
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

  it("should reject delete service if service id is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
    token = user.token!;

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id + 1}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete service if token is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id + 1}`,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/services", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await UserTest.delete();
  });

  let token = "";

  it("should search service if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.get();
    token = user.token!;

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
    token = user.token!;

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using model", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using customer name", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using phone number", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using status", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using page", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service if no result", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.get();
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
    expect(body.data.length).toBe(0);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(0);
    expect(body.paging.size).toBe(10);
  });

  it("should support multiple sort", async () => {
    await UserTest.createAdminGoogle();
    const technician = await TechnicianTest.create();
    const user = await UserTest.get();
    token = user.token!;

    await prismaClient.service.create({
      data: {
        service_id: "SRV-125",
        brand: "OTHER",
        model: "test",
        customer_name: "test",
        phone_number: "test",
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
        phone_number: "test",
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
    expect(body.data.length).toBe(2);
  });

  it("should reject search service if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.get();
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
});
