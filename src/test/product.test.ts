import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { ProductTest, TestRequest, UserTest } from "./test-utils";
import type { CreateProductRequest } from "../model/product-model";
import { logger } from "../application/logging";

describe("POST /api/products", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  it("should create a new product", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateProductRequest = {
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.brand).toBe("OTHER");
    expect(body.data.manufacturer).toBe("ORIGINAL");
    expect(body.data.category).toBe("OTHER");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should create a new product with not default enum value", async () => {
    await UserTest.createAdmin();

    const requestBody: CreateProductRequest = {
      name: "test product",
      brand: "SAMSUNG",
      manufacturer: "WIZZ",
      category: "LCD",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("WIZZ");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should reject a new product with the same name", async () => {
    await UserTest.createAdmin();

    await ProductTest.create();

    const requestBody: CreateProductRequest = {
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject create new product if user is not admin", async () => {
    await UserTest.create();

    await ProductTest.create();

    const requestBody: CreateProductRequest = {
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject create new product if user token is invalid", async () => {
    await UserTest.createAdmin();

    await ProductTest.create();

    const requestBody: CreateProductRequest = {
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "wrong_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject create new product if request body is empty", async () => {
    await UserTest.createAdmin();

    await ProductTest.create();

    const requestBody: CreateProductRequest = {
      name: "",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 10000,
      cost_price: 10000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/products/:id", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  it.only("should get a product if user is admin", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it.only("should get a product if user is not admin and token is valid", async () => {
    await UserTest.create();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it.only("should get a product if user is not logged in", async () => {
    const product = await ProductTest.create();

    const response = await TestRequest.get(`/api/products/${product.id}`);

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it.only("should reject get product if product id is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id + 1}`,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it.only("should reject get product if token admin is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "wrong_token"
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});
