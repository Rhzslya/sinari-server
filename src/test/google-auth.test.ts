import { describe, afterEach, it, expect, spyOn, beforeEach } from "bun:test";
import { TestRequest, UserTest } from "./test-utils";
import { GoogleAuth } from "../utils/google-auth";
import { logger } from "../application/logging";

describe("POST /api/auth/google", () => {
  beforeEach(async () => {
    // await UserTest.createGoogleDuplicate();
  });

  afterEach(async () => {
    await UserTest.deleteGoogleDuplicate();
  });

  it("should be register new user if email from google", async () => {
    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "123123123",
      email: "test123@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "TEST_TOKEN",
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const userInDb = await UserTest.findByEmail("test123@gmail.com");

    expect(userInDb).not.toBeNull();
    expect(userInDb!.is_verified).toBe(true);

    expect(body.data.email).toBe("test123@gmail.com");
    expect(body.data.name).toBe("test");
    expect(body.data.google_id).toBe("123123123");
    expect(body.data.token).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should be login with Google if email from google", async () => {
    await UserTest.createGoogleDuplicate();

    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "123123123",
      email: "test123@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "test_token",
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    expect(body.data.email).toBe("test123@gmail.com");
    expect(body.data.name).toBe("test");
    expect(body.data.google_id).toBe("123123123");
    expect(body.data.token).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should generate random username suffix if username already exists ", async () => {
    await UserTest.createGoogleDuplicate();

    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "99999",
      email: "test@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "TEST_TOKEN",
    });

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).not.toBe("test");
    expect(body.data.username).toContain("test-");
    expect(body.data.token).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should reject register or login if Email is not from Google Login", async () => {
    await UserTest.create();

    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "123123123",
      email: "test@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "TEST_TOKEN",
    });

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(409);
    expect(body.errors).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should reject login if google token is invalid", async () => {
    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue(null);

    const response = await TestRequest.post("/api/auth/google", {
      token: "wrong_token",
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should reject login if google id miss match", async () => {
    await UserTest.createGoogleDuplicate();

    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "1233123123",
      email: "test123@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "TEST_TOKEN",
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(409);
    expect(body.errors).toBeDefined();

    googleSpy.mockRestore();
  });

  it("should reject login if google id is already linked to another user", async () => {
    await UserTest.createGoogleDuplicate();

    const googleSpy = spyOn(GoogleAuth, "verifyToken").mockResolvedValue({
      google_id: "123123123",
      email: "test1234@gmail.com",
      name: "test",
    });

    const response = await TestRequest.post("/api/auth/google", {
      token: "TEST_TOKEN",
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(409);
    expect(body.errors).toBeDefined();

    googleSpy.mockRestore();
  });
});
