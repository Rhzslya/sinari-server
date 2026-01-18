import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { ProductTest, TestRequest, UserTest } from "./test-utils";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../model/product-model";
import { logger } from "../application/logging";
import { prismaClient } from "../application/database";

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

describe("GET /api/products", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  it("should get a product if user is admin", async () => {
    await UserTest.createAdmin();

    const product = await ProductTest.create();

    const response = await TestRequest.get(`/api/products`, "test_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(product.id);
  });

  it("should list products without token (Guest Mode)", async () => {
    await ProductTest.create();

    const response = await TestRequest.get("/api/products");
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].cost_price).toBeUndefined();
  });

  it("should reject request with invalid token", async () => {
    await UserTest.createAdmin();
    await ProductTest.create();

    const response = await TestRequest.get("/api/products", "wrong_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should filter products by name", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "APPLE",
        category: "OTHER",
        price: 20000000,
        cost_price: 18000000,
        stock: 10,
      },
    });
    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "SAMSUNG",
        category: "OTHER",
        price: 19000000,
        cost_price: 17000000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?name=test",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(2);
    expect(body.data[0].name).toBe("test");
  });

  it("should filter products by brand", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "APPLE",
        category: "OTHER",
        price: 20000000,
        cost_price: 18000000,
        stock: 10,
      },
    });
    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "SAMSUNG",
        category: "OTHER",
        price: 19000000,
        cost_price: 17000000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?brand=OTHER",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(2);
    expect(body.data[0].name).toBe("test");
  });

  it("should filter products by manufacturer", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "APPLE",
        category: "OTHER",
        price: 20000000,
        cost_price: 18000000,
        stock: 10,
      },
    });
    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "SAMSUNG",
        category: "OTHER",
        price: 19000000,
        cost_price: 17000000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?manufacturer=APPLE",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe("test");
  });

  it("should filter products by category", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "APPLE",
        category: "OTHER",
        price: 20000000,
        cost_price: 18000000,
        stock: 10,
      },
    });
    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "SAMSUNG",
        category: "OTHER",
        price: 19000000,
        cost_price: 17000000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?category=OTHER",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(2);
    expect(body.data[0].name).toBe("test");
  });

  it("should filter products by price range", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "APPLE",
        category: "OTHER",
        price: 2000,
        cost_price: 18000000,
        stock: 10,
      },
    });
    await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "SAMSUNG",
        category: "OTHER",
        price: 1000,
        cost_price: 17000000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?max_price=2000&min_price=1500",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe("test");
  });

  it("should support pagination", async () => {
    await UserTest.createAdmin();

    for (let i = 0; i < 15; i++) {
      await prismaClient.product.create({
        data: {
          name: `test ${i}`,
          brand: "OTHER",
          manufacturer: "APPLE",
          category: "OTHER",
          price: 2000,
          cost_price: 18000000,
          stock: 10,
        },
      });
    }

    const response = await TestRequest.get(
      "/api/products?page=2&size=10",
      "test_token",
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(5);
    expect(body.paging.current_page).toBe(2);
    expect(body.paging.total_page).toBe(2);
  });

  it("should support multiple sort", async () => {
    await UserTest.createAdmin();

    for (let i = 0; i < 15; i++) {
      await prismaClient.product.create({
        data: {
          name: `test ${i}`,
          brand: "OTHER",
          manufacturer: "APPLE",
          category: "OTHER",
          price: 1000 * (i + 1),
          cost_price: 18000000,
          stock: 10,
        },
      });
    }

    const response = await TestRequest.get(
      "/api/products?sort_by=price&sort_order=asc&page=1&size=10",
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(10);
    expect(body.data[0].name).toBe("test 0");
    expect(body.data[0].price).toBe(1000);
    expect(body.paging.current_page).toBe(1);
    expect(body.paging.total_page).toBe(2);
    expect(body.data[9].name).toBe("test 9");
  });

  it("should filter products by brand AND manufacturer simultaneously", async () => {
    await UserTest.createAdmin();

    await prismaClient.product.create({
      data: {
        name: "test batre",
        brand: "SAMSUNG",
        manufacturer: "VIZZ",
        category: "OTHER",
        price: 50000,
        cost_price: 40000,
        stock: 10,
      },
    });

    await prismaClient.product.create({
      data: {
        name: "test batre",
        brand: "SAMSUNG",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 100000,
        cost_price: 90000,
        stock: 10,
      },
    });

    await prismaClient.product.create({
      data: {
        name: "test batre",
        brand: "APPLE",
        manufacturer: "VIZZ",
        category: "OTHER",
        price: 50000,
        cost_price: 40000,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?brand=SAMSUNG&manufacturer=VIZZ",
      "test_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    expect(body.data.length).toBe(1);

    expect(body.data[0].name).toBe("test batre");
    expect(body.data[0].brand).toBe("SAMSUNG");
    expect(body.data[0].manufacturer).toBe("VIZZ");
  });
});
