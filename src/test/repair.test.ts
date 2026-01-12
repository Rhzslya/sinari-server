import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { ServiceTest, UserTest, UserTestRequest } from "./test-utils";
import type { CreateServiceRequest } from "../model/repair-model";
import { logger } from "../application/logging";

describe("POST /api/services", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
    await ServiceTest.deleteAll();
  });

  it("should create service", async () => {
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

  it.only("should create service even if optional fields are missing", async () => {
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

  it.only("should reject create service if service price is negative", async () => {
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

  it.only("should reject create service if required fields are empty strings", async () => {
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
});
