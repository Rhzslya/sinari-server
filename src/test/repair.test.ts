import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import {
  ServiceTest,
  ServiceTestRequest,
  UserTest,
  UserTestRequest,
} from "./test-utils";
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../model/repair-model";
import { logger } from "../application/logging";

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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.discount).toBe(0);
    expect(body.data.status).toBe("pending");
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "wrong_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.post<CreateServiceRequest>(
      "/api/services",
      requestBody,
      "test_token"
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

    const response = await UserTestRequest.get(`/api/services/${service.id}`, {
      Authorization: `Bearer test_token`,
    });

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should get service by id if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const service = await ServiceTest.create();

    const response = await UserTestRequest.get(`/api/services/${service.id}`, {
      Authorization: `Bearer test_token`,
    });

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(service.id);
  });

  it("should reject get service if user is not admin", async () => {
    await UserTest.create();

    const service = await ServiceTest.create();

    const response = await UserTestRequest.get(`/api/services/${service.id}`, {
      Authorization: `Bearer test_token`,
    });

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject get service if service id is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const response = await UserTestRequest.get(
      `/api/services/${service.id + 1}`,
      {
        Authorization: `Bearer test_token`,
      }
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

    const response = await UserTestRequest.get(
      `/api/public/services/track/${service.tracking_token}`
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
  });

  it("should reject service if token is invalid", async () => {
    const service = await ServiceTest.create();

    const response = await UserTestRequest.get(
      `/api/public/services/track/${service.tracking_token + "wrong"}`
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

  it("should update service if user is admin", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "process",
      technician_note: "Fixing...",
    };

    const response = await ServiceTestRequest.update<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      { Authorization: `Bearer test_token` },
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("process");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should update service list and recalculate total price", async () => {
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

    const response = await ServiceTestRequest.update<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      { Authorization: `Bearer test_token` },
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.service_list[0].price).toBe(1000);
    expect(body.data.service_list[1].price).toBe(10000);
    expect(body.data.total_price).toBe(11000);
  });

  it("should update service if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "process",
      technician_note: "Fixing...",
    };

    const response = await ServiceTestRequest.update<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      { Authorization: `Bearer test_token` },
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("process");
    expect(body.data.technician_note).toBe("Fixing...");
  });

  it("should reject update service if user is not admin", async () => {
    await UserTest.create();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "process",
      technician_note: "Fixing...",
    };

    const response = await ServiceTestRequest.update<UpdateServiceRequest>(
      `/api/services/${service.id}`,
      { Authorization: `Bearer test_token` },
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject update service if service id is invalid", async () => {
    await UserTest.createAdmin();

    const service = await ServiceTest.create();

    const requestBody: UpdateServiceRequest = {
      id: service.id,
      status: "process",
      technician_note: "Fixing...",
    };

    const response = await ServiceTestRequest.update<UpdateServiceRequest>(
      `/api/services/${service.id + 10}`,
      { Authorization: `Bearer test_token` },
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });
});
