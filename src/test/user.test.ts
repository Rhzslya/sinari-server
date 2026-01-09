import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { TestRequest, UserTest } from "./test-utils";
import { logger } from "../application/logging";
import type { CreateUserRequest, LoginUserRequest } from "../model/user-model";

describe("POST /api/users", () => {
  // beforeEach(async () => {
  //   await UserTest.create();
  // });

  afterEach(async () => {
    await UserTest.delete();
  });

  it("should register user", async () => {
    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "test",
      name: "test",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  });

  it("it should reject register new user if request is invalid", async () => {
    const requestBody: CreateUserRequest = {
      email: "",
      username: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject register new user if username already exists", async () => {
    await UserTest.create();

    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "test",
      name: "test",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject register new user if email already exists", async () => {
    await UserTest.create();

    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test12",
      password: "test",
      name: "test",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  it("should login user if email and password is correct", async () => {
    const requestBody: LoginUserRequest = {
      email: "test@gmail.com",
      password: "test",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  });

  it("should login user if username and password is correct", async () => {
    const requestBody: LoginUserRequest = {
      username: "test",
      password: "test",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  });

  it("should reject login if username is wrong", async () => {
    const requestBody: LoginUserRequest = {
      username: "wrong",
      password: "test",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject login if email is wrong", async () => {
    const requestBody: LoginUserRequest = {
      email: "wrong@gmail.com",
      password: "test",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject login if password is wrong", async () => {
    const requestBody: LoginUserRequest = {
      email: "test@gmail.com",
      password: "wrong",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject login if data is null", async () => {
    const requestBody: LoginUserRequest = {
      email: "",
      password: "",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("GET /api/users/current", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
  });

  it("should get current user", async () => {
    const response = await TestRequest.get("/api/users/current", {
      Authorization: `Bearer test_token`,
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  });

  it("should reject user if token is invalid", async () => {
    const response = await TestRequest.get("/api/users/current", {
      Authorization: `Bearer wrong_token`,
    });
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});
