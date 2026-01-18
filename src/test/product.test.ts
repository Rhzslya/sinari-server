import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { ProductTest, TestRequest, UserTest } from "./test-utils";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../model/product-model";
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
      "test_token",
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
      "test_token",
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
      "test_token",
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
      "test_token",
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
      "wrong_token",
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
      "test_token",
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

  it("should get a product if user is admin", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product if user is not admin and token is valid", async () => {
    await UserTest.create();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product if user is not logged in", async () => {
    const product = await ProductTest.create();

    const response = await TestRequest.get(`/api/products/${product.id}`);

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product WITHOUT cost_price if user is guest", async () => {
    const product = await ProductTest.create();

    const response = await TestRequest.get(`/api/products/${product.id}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.cost_price).toBeUndefined();
    expect(body.data.price).toBeDefined();
  });

  it("should get a product WITH cost_price if user is admin", async () => {
    await UserTest.createAdmin();
    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "test_token",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.cost_price).toBeDefined();
  });

  it("should reject get product if product id is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id + 1}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject get product if token admin is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});

describe("PATCH /api/products/:id", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  it("should update a product if user is admin", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      brand: "SAMSUNG",
      manufacturer: "meetoo",
      category: "LCD",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.patch<UpdateProductRequest>(
      `/api/products/${product.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should update a product if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      brand: "SAMSUNG",
      manufacturer: "meetoo",
      category: "LCD",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.patch<UpdateProductRequest>(
      `/api/products/${product.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should update a product if there are product with same name but different brand, manufacturer, and category", async () => {
    await UserTest.createAdminGoogle();

    await ProductTest.create();

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      brand: "SAMSUNG",
      manufacturer: "meetoo",
      category: "LCD",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.patch<UpdateProductRequest>(
      `/api/products/${product.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should allow update product price/stock even if name/brand is same (Self Update)", async () => {
    await UserTest.createAdmin();
    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 25000,
    };

    const response = await TestRequest.patch<UpdateProductRequest>(
      `/api/products/${product.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.price).toBe(25000);
    expect(body.data.name).toBe("test product");
  });

  it("should reject update product if name, brand, manufacturer, and category are same", async () => {
    await UserTest.createAdminGoogle();

    await ProductTest.create();

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      name: "test product",
      brand: "OTHER",
      manufacturer: "original",
      category: "OTHER",
      price: 10000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.patch<UpdateProductRequest>(
      `/api/products/${product.id}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject update product if product is not found", async () => {
    await UserTest.createAdmin();
    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      name: "test product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 25000,
    };

    const response = await TestRequest.patch(
      `/api/products/${product.id + 20}`,
      requestBody,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject update product if user is not admin", async () => {
    await UserTest.create();
    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}`,
      { price: 500 },
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });
});

describe("DELETE /api/products/:id", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  it("should delete a product if user is admin", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.message).toBe("Product deleted successfully");
  });

  it("should delete a product if user is admin google", async () => {
    await UserTest.createAdminGoogle();

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.message).toBe("Product deleted successfully");
  });

  it("should reject delete product if product id is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id + 1}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete product if user is not admin", async () => {
    await UserTest.create();

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete product if user token is invalid", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});
