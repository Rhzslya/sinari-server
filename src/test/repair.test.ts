import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { ServiceTest, TestRequest, UserTest } from "./test-utils";
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
  });

  it("should create service", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
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
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("test");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("08123123123");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
  });

  it("should create service if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const requestBody: CreateServiceRequest = {
      brand: "test",
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
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("test");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("test");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
  });

  it("should create service if service list is multiple", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
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
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("test");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("test");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].name).toBe("test2");
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_items).toBe(2);
    expect(body.data.discount).toBe(0);
    expect(body.data.total_price).toBe(11000);
  });

  it("should create service if service list is multiple and have discount", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
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
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("test");
    expect(body.data.model).toBe("test");
    expect(body.data.customer_name).toBe("test");
    expect(body.data.phone_number).toBe("test");
    expect(body.data.description).toBe("test");
    expect(body.data.technician_note).toBe("test");
    expect(body.data.service_list[0].name).toBe("test");
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].name).toBe("test2");
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_items).toBe(2);
    expect(body.data.discount).toBe(10);
    expect(body.data.total_price).toBe(9900);
  });

  it("should create service even if optional fields are missing", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
      model: "test",
      customer_name: "Simple User",
      phone_number: "08123",
      service_list: [{ name: "Fix", price: 1000 }],
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.discount).toBe(0);
    expect(body.data.status).toBe("PENDING");
    expect(body.data.description).toBeNull();
    expect(body.data.technician_note).toBeNull();
  });

  it("should reject create service if service list is empty", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
      model: "test",
      customer_name: "test",
      phone_number: "test",
      description: "test",
      technician_note: "test",
      service_list: [],
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if token login is invalid", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
      model: "test",
      customer_name: "test",
      phone_number: "test",
      description: "test",
      technician_note: "test",
      service_list: [],
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

    const requestBody: CreateServiceRequest = {
      brand: "test",
      model: "test",
      customer_name: "test",
      phone_number: "test",
      service_list: [{ name: "Service 1", price: 10000 }],
      discount: 150,
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if service price is negative", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "test",
      model: "test",
      customer_name: "test",
      phone_number: "test",
      service_list: [
        {
          name: "Ganti LCD",
          price: -50000,
        },
      ],
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if required fields are empty strings", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateServiceRequest = {
      brand: "",
      model: "",
      customer_name: "Valid Name",
      phone_number: "08123",
      service_list: [{ name: "Fix", price: 1000 }],
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create service if user is not admin", async () => {
    await UserTest.create();

    const requestBody: CreateServiceRequest = {
      brand: "test",
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
    };

    const response = await TestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token",
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.errors).toContain("Forbidden");
  });
});

describe("GET /api/services/:id", () => {
  afterEach(async () => {
    await ServiceTest.deleteAll();
    await UserTest.delete();
  });

  it("should get service by id if user is admin", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should get service by id if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should reject get service if user is not admin", async () => {
    await UserTest.create();

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject get service if service id is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await TestRequest.get(
      `/api/services/${service.id + 1}`,
      "test_token",
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

  it("should patch service if user is admin", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("PROCESS");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should patch service list and recalculate total price", async () => {
    await UserTest.createAdmin();

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
      "test_token",
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

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("PROCESS");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should reject patch service if user is not admin", async () => {
    await UserTest.create();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject patch service if service id is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "PROCESS",
      technician_note: "Fixing...",
    };

    const response = await TestRequest.patch<UpdateServiceRequest>(
      `/api/services/${service.id + 10}`,
      requestBody,
      "test_token",
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

  it("should delete service if user is admin", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      "test_token",
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

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      "test_token",
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

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete service if service id is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await TestRequest.delete(
      `/api/services/${service.id + 1}`,
      "test_token",
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

  it("should search service if user is admin", async () => {
    await UserTest.createAdmin();

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", "test_token");

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

    await ServiceTest.create();

    const response = await TestRequest.get("/api/services", "test_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(1);
    expect(body.paging.size).toBe(10);
  });

  it("should search service using brand", async () => {
    await UserTest.createAdminGoogle();
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      brand: "es",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
    );

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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      model: "te",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      customer_name: "st",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      phone_number: "08123",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      status: "pending",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      brand: "wrong",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
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

    await prismaClient.service.create({
      data: {
        brand: "test",
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
      },
    });

    await prismaClient.service.create({
      data: {
        brand: "test",
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
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(2);
  });

  it("should reject search service if user is not admin", async () => {
    await UserTest.create();
    await ServiceTest.create();

    const queryParams = new URLSearchParams({
      brand: "wrong",
      page: "1",
      size: "10",
    }).toString();

    const response = await TestRequest.get(
      `/api/services?${queryParams}`,
      "test_token",
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });
});
