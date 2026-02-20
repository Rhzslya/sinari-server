import { describe, afterEach, it, expect } from "bun:test";
import {
  ProductLogTest,
  ProductTest,
  TestRequest,
  UserTest,
} from "./test-utils";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ProductLogAction } from "../../generated/prisma/client";

describe.only("Product Log API", () => {
  afterEach(async () => {
    await ProductLogTest.delete();
    await ProductTest.delete();
    await UserTest.delete();
  });

  describe("GET /api/products/:id/logs", () => {
    it("should get product logs successfully if user is OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const product = await ProductTest.create();

      await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.RESTOCK,
          quantity_change: 10,
          description: "Test get logs",
        },
      });

      const response = await TestRequest.get(
        `/api/products/${product.id}/logs`,
        token,
      );
      const body = await response.json();
      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].action).toBe(ProductLogAction.RESTOCK);
      expect(body.data[0].user).toBeDefined();
    });

    it("should reject getting logs if user is ADMIN (Forbidden)", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      const product = await ProductTest.create();

      const response = await TestRequest.get(
        `/api/products/${product.id}/logs`,
        token,
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
    });

    it("should return 404 if product does not exist", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();

      const response = await TestRequest.get(
        `/api/products/999999/logs`,
        owner.token!,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/product-logs/:id/void", () => {
    it("should successfully void a log and revert stock", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();

      const product = await ProductTest.create();

      const log = await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.SALE_OFFLINE,
          quantity_change: -2,
          description: "Sold 2 items",
        },
      });

      const response = await TestRequest.patch(
        `/api/product-logs/${log.id}/void`,
        {},
        owner.token!,
      );

      const body = await response.json();
      logger.debug("Void Success Response:", body);

      expect(response.status).toBe(200);

      const updatedLog = await prismaClient.productLog.findUnique({
        where: { id: log.id },
      });
      expect(updatedLog?.is_voided).toBe(true);

      const updatedProduct = await prismaClient.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.stock).toBe(12);

      const voidLog = await prismaClient.productLog.findFirst({
        where: { action: ProductLogAction.VOID_LOG, product_id: product.id },
      });
      expect(voidLog).toBeDefined();
      expect(voidLog?.quantity_change).toBe(2);
    });

    it("should reject voiding if it causes NEGATIVE stock", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();

      // Product stock = 10
      const product = await ProductTest.create();

      const log = await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.RESTOCK,
          quantity_change: 15,
          description: "Restocked 15 items",
        },
      });

      const response = await TestRequest.patch(
        `/api/product-logs/${log.id}/void`,
        {},
        owner.token!,
      );

      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.errors).toContain("negative stock");
    });

    it("should reject voiding for unvoidable actions (e.g. CREATED)", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const product = await ProductTest.create();

      const log = await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.CREATED,
          quantity_change: 0,
          description: "Product created",
        },
      });

      const response = await TestRequest.patch(
        `/api/product-logs/${log.id}/void`,
        {},
        owner.token!,
      );

      expect(response.status).toBe(400);
    });

    it("should reject voiding if log is already voided", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const product = await ProductTest.create();

      const log = await prismaClient.productLog.create({
        data: {
          product_id: product.id,
          user_id: owner.id,
          action: ProductLogAction.RESTOCK,
          quantity_change: 5,
          is_voided: true, // SUDAH DI-VOID SEBELUMNYA
          description: "Restock",
        },
      });

      const response = await TestRequest.patch(
        `/api/product-logs/${log.id}/void`,
        {},
        owner.token!,
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.errors).toBe("Log is already voided");
    });
  });
});
