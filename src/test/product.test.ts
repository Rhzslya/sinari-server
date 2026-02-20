import { describe, afterEach, beforeEach, it, expect, jest } from "bun:test";
import {
  ProductLogTest,
  ProductTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../model/product-model";
import { logger } from "../application/logging";
import { prismaClient } from "../application/database";
import { CloudinaryService } from "../service/cloudinary-service";

describe("POST /api/products", () => {
  afterEach(async () => {
    await ProductLogTest.delete();
    await ProductTest.delete();
    await UserTest.delete();
  });
  let token = "";

  it("should create a new product", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
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
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
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
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const requestBody: CreateProductRequest = {
      name: "test",
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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(409);
    expect(body.errors).toBeDefined();
  });

  it("should reject create new product if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject create new product if user token is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should create a new product if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const requestBody: CreateProductRequest = {
      name: "Owner Product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 15000,
      cost_price: 10000,
      stock: 5,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      token,
    );
    expect(response.status).toBe(200);
  });

  it("should reject product creation if selling price is lower than cost price", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const requestBody: CreateProductRequest = {
      name: "Rugi Product",
      brand: "OTHER",
      manufacturer: "ORIGINAL",
      category: "OTHER",
      price: 5000,
      cost_price: 8000,
      stock: 10,
    };

    const response = await TestRequest.post<CreateProductRequest>(
      "/api/products",
      requestBody,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should create product WITH image (multipart/form-data)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const formData = new FormData();
    formData.append("name", "Product With Image");
    formData.append("brand", "SAMSUNG");
    formData.append("manufacturer", "ORIGINAL");
    formData.append("category", "LCD");
    formData.append("price", "20000");
    formData.append("cost_price", "15000");
    formData.append("stock", "10");

    const highContrastPng =
      "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnUlEQVR4nO3RAQ0AAAwCoNm/9DQGHeAgISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhISFhIWGPBf99An77S88AAAAASUVORK5CYII=";

    const imageBuffer = Buffer.from(highContrastPng, "base64");
    const dummyImage = new Blob([imageBuffer], { type: "image/png" });
    const file = new File([dummyImage], "product.png", { type: "image/png" });

    formData.append("image", file);

    const response = await TestRequest.postMultipart(
      "/api/products",
      formData,
      token,
    );
    const body = await response.json();

    if (response.status !== 200) {
      console.log("CLOUDINARY ERROR:", body.errors);
    }

    expect(response.status).toBe(200);
    expect(body.data.image_url).not.toBe("");
  }, 15000);
});

describe("GET /api/products/:id", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  let token = "";
  it("should get a product if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product if user is not admin and token is valid", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/public/products/${product.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product if user is not logged in", async () => {
    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/public/products/${product.id}`,
    );

    const body = await response.json();

    logger.debug(body);
    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);
  });

  it("should get a product WITHOUT cost_price if user is guest", async () => {
    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/public/products/${product.id}`,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.cost_price).toBeUndefined();
    expect(body.data.price).toBeDefined();
  });

  it("should get a product WITH cost_price if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.cost_price).toBeDefined();
  });

  it("should reject get product if product id is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id + 1}`,
      token,
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

  it("should get a product WITH cost_price if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(
      `/api/products/${product.id}`,
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.cost_price).toBeDefined();
    expect(body.data.id).toBe(product.id);
  });
});

describe("PATCH /api/products/:id", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
    jest.restoreAllMocks();
  });

  let token = "";

  it("should update a product if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should update a product if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should update a product if there are product with same name but different brand, manufacturer, and category", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test");
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
    expect(body.data.category).toBe("LCD");
    expect(body.data.price).toBe(10000);
    expect(body.data.cost_price).toBe(8000);
    expect(body.data.stock).toBe(10);
  });

  it("should allow update product price/stock even if name/brand is same (Self Update)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.price).toBe(25000);
    expect(body.data.name).toBe("test product");
  });

  it("should reject update product if name, brand, manufacturer, and category are same", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    await ProductTest.create();

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      name: "test",
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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject update product if product is not found", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject update product if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}`,
      { price: 500 },
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should update a product (JSON only)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      name: "test product",
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
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.brand).toBe("SAMSUNG");
    expect(body.data.manufacturer).toBe("MEETOO");
  });

  it("should update product with image (Multipart)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const product = await ProductTest.create();

    const mockUpload = jest
      .spyOn(CloudinaryService, "uploadImageProduct")
      .mockResolvedValue("https://mock-url.com/gambar-baru.jpg");

    const formData = new FormData();
    formData.append("name", "test product");
    const file = new Blob(["dummy-content"], { type: "image/png" });
    formData.append("image", file, "test.png");

    const response = await TestRequest.patchMultipart(
      `/api/products/${product.id}`,
      formData,
      token,
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test product");
    expect(body.data.image_url).toBe("https://mock-url.com/gambar-baru.jpg");
    expect(mockUpload).toHaveBeenCalled();
  });

  it("should allow update product price/stock even if name/brand is same (Self Update)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.price).toBe(25000);
  });

  it("should reject update if cost price becomes higher than selling price", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const requestBody: UpdateProductRequest = {
      id: product.id,
      cost_price: 12000,
    };

    const response = await TestRequest.patch(
      `/api/products/${product.id}`,
      requestBody,
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toContain("Cost price cannot exceed selling price");
  });

  it("should successfully delete product image", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await prismaClient.product.create({
      data: {
        name: "Image Product",
        brand: "OTHER",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 1000,
        cost_price: 500,
        image_url: "https://cloudinary.com/old-image.jpg",
      },
    });

    const response = await TestRequest.patch(
      `/api/products/${product.id}`,
      { id: product.id, delete_image: true },
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.image_url).toBeNull();
  });
});

describe("DELETE /api/products/:id", () => {
  afterEach(async () => {
    await ProductLogTest.delete();
    await ProductTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should delete a product if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
  });

  it("should delete a product if user is admin google", async () => {
    await UserTest.createAdminGoogle();
    const user = await UserTest.getAdminGoogle();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
  });

  it("should reject delete product if product id is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id + 1}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete product if user is not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete product if user token is invalid", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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

  it("should delete a product (soft delete) and clear image if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    const token = user.token!;

    const product = await prismaClient.product.create({
      data: {
        name: "Delete Me",
        brand: "OTHER",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 1000,
        cost_price: 500,
        image_url: "http://cloudinary.com/product.jpg",
      },
    });

    const response = await TestRequest.delete(
      `/api/products/${product.id}`,
      token,
    );

    expect(response.status).toBe(200);

    const check = await prismaClient.product.findUnique({
      where: { id: product.id },
    });
    expect(check?.deleted_at).not.toBeNull();
    expect(check?.image_url).toBeNull();

    const log = await prismaClient.productLog.findFirst({
      where: { product_id: product.id, action: "DELETED" },
    });
    expect(log).toBeDefined();
  });

  it("should reject delete product if product id is not found", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    const token = user.token!;

    const response = await TestRequest.delete(`/api/products/999999`, token);

    expect(response.status).toBe(404);
  });
});

describe("GET /api/products", () => {
  afterEach(async () => {
    await ProductTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should get a product if user is admin", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.get(`/api/products`, token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].id).toBe(product.id);
  });

  it("should list products without token (Guest Mode)", async () => {
    await ProductTest.create();

    const response = await TestRequest.get("/api/public/products");
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].cost_price).toBeUndefined();
  });

  it("should reject request with invalid token", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const response = await TestRequest.get("/api/products", "wrong_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should filter products by name", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const queryParams = new URLSearchParams({
      name: "te",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test");
  });

  it("should filter products by brand", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const queryParams = new URLSearchParams({
      brand: "OTHER",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test");
  });

  it("should filter products by manufacturer", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const queryParams = new URLSearchParams({
      manufacturer: "ORIGINAL",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test");
  });

  it("should filter products by category", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const queryParams = new URLSearchParams({
      category: "OTHER",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test");
  });

  it("should filter products by price range", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await ProductTest.create();

    const queryParams = new URLSearchParams({
      min_price: "1000",
      max_price: "10000",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("test");
  });

  it("should support pagination", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    for (let i = 0; i < 15; i++) {
      await prismaClient.product.create({
        data: {
          name: `test_${i}`,
          brand: "OTHER",
          manufacturer: "APPLE",
          category: "OTHER",
          price: 2000,
          cost_price: 18000000,
          stock: 10,
        },
      });
    }

    const queryParams = new URLSearchParams({
      page: "2",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(5);
    expect(body.data.paging.current_page).toBe(2);
    expect(body.data.paging.total_page).toBe(2);
  });

  it("should support multiple sort", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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

    const queryParams = new URLSearchParams({
      sort_by: "price",
      sort_order: "asc",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(10);
    expect(body.data.data[0].name).toBe("test 0");
    expect(body.data.data[0].price).toBe(1000);
    expect(body.data.paging.current_page).toBe(1);
    expect(body.data.paging.total_page).toBe(2);
    expect(body.data.data[9].name).toBe("test 9");
  });

  it("should filter products by brand AND category", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

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
        brand: "SAMSUNG",
        manufacturer: "VIZZ",
        category: "LCD",
        price: 50000,
        cost_price: 40000,
        stock: 10,
      },
    });

    const queryParams = new URLSearchParams({
      brand: "SAMSUNG",
      category: "LCD",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    expect(body.data.data.length).toBe(1);

    expect(body.data.data[0].name).toBe("test batre");
    expect(body.data.data[0].brand).toBe("SAMSUNG");
    expect(body.data.data[0].category).toBe("LCD");
  });

  it("should filter products price range with descending order", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await prismaClient.product.create({
      data: {
        name: "test batre",
        brand: "SAMSUNG",
        manufacturer: "VIZZ",
        category: "OTHER",
        price: 10000,
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
        price: 12000,
        cost_price: 40000,
        stock: 10,
      },
    });

    const queryParams = new URLSearchParams({
      min_price: "1000",
      max_price: "50000",
      sort_by: "price",
      sort_order: "desc",
      page: "1",
      size: "10",
    });

    const response = await TestRequest.get(
      `/api/products?${queryParams}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(2);
    expect(body.data.data[0].name).toBe("test batre");
  });

  it("should return ONLY in-stock products when in_stock_only is true", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await prismaClient.product.create({
      data: {
        name: "Out of Stock",
        brand: "OTHER",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 1000,
        cost_price: 500,
        stock: 0,
      },
    });

    await prismaClient.product.create({
      data: {
        name: "In Stock",
        brand: "OTHER",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 1000,
        cost_price: 500,
        stock: 10,
      },
    });

    const response = await TestRequest.get(
      "/api/products?in_stock_only=true",
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe("In Stock");
  });

  it("should list deleted products only when is_deleted is true", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();
    await prismaClient.product.update({
      where: { id: product.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.get(
      "/api/products?is_deleted=true",
      token,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].id).toBe(product.id);
  });

  it("should NOT show cost_price to user with CUSTOMER role", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    await ProductTest.create();

    const response = await TestRequest.get("/api/public/products", token);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.data[0].cost_price).toBeUndefined();
  });
});

describe("PATCH /api/products/:id/stock", () => {
  afterEach(async () => {
    await prismaClient.productLog.deleteMany({});
    await ProductTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should successfully restock (Positive Adjustment)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 20, stock_action: "RESTOCK" },
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stock).toBe(20);

    const log = await prismaClient.productLog.findFirst({
      where: { product_id: product.id, action: "RESTOCK" },
    });
    expect(log?.quantity_change).toBe(10);
  });

  it("should successfully record SALE_OFFLINE with revenue and profit", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 7, stock_action: "SALE_OFFLINE" },
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stock).toBe(7);

    const log = await prismaClient.productLog.findFirst({
      where: { product_id: product.id, action: "SALE_OFFLINE" },
    });

    expect(log?.total_revenue).toBe(30000);
    expect(log?.total_profit).toBe(6000);
    expect(log?.quantity_change).toBe(-3);
  });

  it("should reject if stock value is the same", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 10, stock_action: "ADJUST_OPNAME" },
      token,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors).toContain("exactly the same");
  });

  it("should reject illegal action for stock INCREASE (e.g., SALE_OFFLINE on restock)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 15, stock_action: "SALE_OFFLINE" },
      token,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors).toContain("not allowed when stock increases");
  });

  it("should reject illegal action for stock DECREASE (e.g., RESTOCK on decrease)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;
    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 5, stock_action: "RESTOCK" },
      token,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors).toContain("not allowed when stock decreases");
  });

  it("should reject update stock if user is CUSTOMER", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;
    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/stock`,
      { stock: 20, stock_action: "RESTOCK" },
      token,
    );

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/products/:id/restore", () => {
  afterEach(async () => {
    await ProductLogTest.delete();
    await ProductTest.delete();
    await UserTest.delete();
  });

  let token = "";

  it("should successfully restore a deleted product if user is OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const product = await ProductTest.create();
    await prismaClient.product.update({
      where: { id: product.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/products/${product.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(product.id);

    const checkRestored = await prismaClient.product.findUnique({
      where: { id: product.id },
    });
    expect(checkRestored?.deleted_at).toBeNull();

    const log = await prismaClient.productLog.findFirst({
      where: { product_id: product.id, action: "RESTORED" },
    });
    expect(log).toBeDefined();
    expect(log?.description).toContain("restored from trash bin");
  });

  it("should reject restore if product is NOT in the trash bin (Still Active)", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const product = await ProductTest.create();

    const response = await TestRequest.patch(
      `/api/products/${product.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toContain("not found in trash bin");
  });

  it("should reject restore if user is ADMIN (Role Protected)", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const product = await ProductTest.create();
    await prismaClient.product.update({
      where: { id: product.id },
      data: { deleted_at: new Date() },
    });

    const response = await TestRequest.patch(
      `/api/products/${product.id}/restore`,
      {},
      token,
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.errors).toContain("Insufficient permissions");
  });

  it("should return 404 if product id does not exist in any state", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    const response = await TestRequest.patch(
      `/api/products/999999/restore`,
      {},
      token,
    );

    expect(response.status).toBe(404);
  });
});
