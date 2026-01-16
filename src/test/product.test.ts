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
});
