import { describe, afterEach, it, expect, beforeEach } from "bun:test";
import { TestRequest, UserTest, StoreSettingTest } from "./test-utils";
import { logger } from "../application/logging";
import { DEFAULT_STORE_SETTING } from "../config/store-setting";

describe("Store Setting API", () => {
  beforeEach(async () => {
    await StoreSettingTest.delete();
    await UserTest.delete();
  });

  afterEach(async () => {
    await StoreSettingTest.delete();
    await UserTest.delete();
  });

  describe("PATCH /api/store-setting", () => {
    it("should successfully CREATE new store settings if database is empty (Upsert Create) as OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const payload = {
        store_name: "Sinari Cell Baru",
        store_address: "Jl. Baru No 99",
        store_phone: "081299998888",
        store_email: "admin@sinaricell.com",
        store_website: "https://sinaricell.com",
        warranty_text: "Garansi 30 Hari",
        payment_info: "Mandiri: 12345678",
      };

      const response = await TestRequest.patch(
        "/api/store-setting",
        payload,
        token,
      );

      const body = await response.json();
      logger.debug("Create Success:", body);

      expect(response.status).toBe(200);
      expect(body.data.store_name).toBe("Sinari Cell Baru");

      const dbSetting = await StoreSettingTest.get();
      expect(dbSetting).toBeDefined();
      expect(dbSetting?.store_phone).toBe("081299998888");
    });

    it("should successfully UPDATE existing store settings (Upsert Update) as OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      await StoreSettingTest.create();

      const payload = {
        store_name: "Sinari Cell Update",
        store_address: "Jl. Update No 99",
        store_phone: "081299998888",
        store_email: "",
        store_website: "",
        warranty_text: "Garansi Update",
        payment_info: "BCA Update",
      };

      const response = await TestRequest.patch(
        "/api/store-setting",
        payload,
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.store_name).toBe("Sinari Cell Update");
      expect(body.data.store_email).toBe("");

      const dbSetting = await StoreSettingTest.get();
      expect(dbSetting?.store_name).toBe("Sinari Cell Update");
      expect(dbSetting?.store_email).toBe("");
    });

    it("should reject request if user is ADMIN (Forbidden)", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();
      const token = admin.token!;

      const payload = {
        store_name: "Hacked by Admin",
        store_address: "Jl. Hack",
        store_phone: "081299998888",
        warranty_text: "Hack",
        payment_info: "Hack",
      };

      const response = await TestRequest.patch(
        "/api/store-setting",
        payload,
        token,
      );

      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
    });

    it("should reject request if validation fails (Invalid Phone Format)", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();
      const token = owner.token!;

      const payload = {
        store_name: "Sinari Cell",
        store_address: "Jl. Melati",
        store_phone: "12345",
        warranty_text: "Test",
        payment_info: "Test",
      };

      const response = await TestRequest.patch(
        "/api/store-setting",
        payload,
        token,
      );

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.errors).toBeDefined();
    });
  });

  describe("GET /api/store-setting", () => {
    it("should successfully get store settings as OWNER", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();

      await StoreSettingTest.create();

      const response = await TestRequest.get(
        "/api/store-setting",
        owner.token!,
      );
      const body = await response.json();

      logger.debug("Get Settings (Owner):", body);

      expect(response.status).toBe(200);
      expect(body.data.store_name).toBe("Original Store Name");
      expect(body.data.store_phone).toBe("081111111111");
    });

    it("should successfully get store settings as ADMIN", async () => {
      await UserTest.createAdmin();
      const admin = await UserTest.getAdmin();

      await StoreSettingTest.create();

      const response = await TestRequest.get(
        "/api/store-setting",
        admin.token!,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.store_name).toBe("Original Store Name");
    });

    it("should reject request if user is CUSTOMER (Forbidden)", async () => {
      const token = await UserTest.create();

      const response = await TestRequest.get("/api/store-setting", token);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
    });

    it("should return default settings if store settings have not been initialized", async () => {
      await UserTest.createOwner();
      const owner = await UserTest.getOwner();

      const response = await TestRequest.get(
        "/api/store-setting",
        owner.token!,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.store_name).toBe(DEFAULT_STORE_SETTING.STORE_NAME);
    });
  });
});
