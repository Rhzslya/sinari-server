import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { TestRequest, UserTest } from "./test-utils";
import { logger } from "../application/logging";
import type {
  CreateUserRequest,
  LoginUserRequest,
  UpdateUserRequest,
} from "../model/user-model";
import bcrypt from "bcrypt";
import { prismaClient } from "../application/database";

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
    // await UserTest.deleteGoogleDuplicate();
  });

  it("should login user if email and password is correct and verify user", async () => {
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

  it("should reject login if email is not verified", async () => {
    await UserTest.unverify();

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

    expect(response.status).toBe(403);
    expect(body.errors).toBe("Please verify your email address first");
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

  it("should reject request if no token provided", async () => {
    const response = await TestRequest.get("/api/users/current");

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});

describe("PATCH /api/users/current", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
  });

  it("should update user name", async () => {
    const updateData: UpdateUserRequest = {
      name: "test2",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test2");
  });

  it("should update user email if email not exists in database", async () => {
    const updateData: UpdateUserRequest = {
      email: "test2@gmail.com",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test2@gmail.com");
  });

  it("should update user password", async () => {
    const updateData: UpdateUserRequest = {
      password: "test2",
      current_password: "test",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    const user = await UserTest.get();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(await bcrypt.compare("test2", user.password!)).toBe(true);
  });

  it("should reject update user password if current password is missing", async () => {
    const updateData: UpdateUserRequest = {
      password: "test2",
      // current_password: "",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    const user = await UserTest.get();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(await bcrypt.compare("test2", user.password!)).toBe(false);
  });

  it("should update user password if user is login with google and will be multiple login", async () => {
    await UserTest.delete();

    await UserTest.createGoogleDuplicate();

    const updateData: UpdateUserRequest = {
      password: "test2",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    const user = await UserTest.get();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(await bcrypt.compare("test2", user.password!)).toBe(true);
  });

  it("should reject update if data is null", async () => {
    const updateData: UpdateUserRequest = {
      email: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject update token is wrong", async () => {
    const updateData: UpdateUserRequest = {
      email: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "wrong_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject update user email if email is exists in database", async () => {
    const updateData: UpdateUserRequest = {
      email: "test@gmail.com",
    };

    const response = await TestRequest.update(
      "/api/users/current",
      updateData,
      "test_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("DELETE /api/auth/logout", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
  });

  it("should logout user", async () => {
    const response = await TestRequest.delete("/api/auth/logout", "test_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data).toBe("OK");

    const user = await UserTest.get();
    expect(user.token).toBeNull();
  });

  it("should reject logout user if token is wrong", async () => {
    const response = await TestRequest.delete(
      "/api/auth/logout",
      "wrong_token"
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });
});

describe("Email Verification", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
  });

  it("should verify user", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "test",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userBefore = await prismaClient.user.findFirst({
      where: {
        username: "test",
      },
    });

    const token = userBefore?.verify_token;

    expect(token).toBeTruthy();

    const response = await TestRequest.get(`/api/auth/verify?token=${token}`);

    expect(response.status).toBe(200);

    const userAfter = await prismaClient.user.findUnique({
      where: { username: "test" },
    });

    expect(userAfter?.is_verified).toBe(true);
    expect(userAfter?.verify_token).toBeNull();
  });

  it("should create user with unverified status ", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "test",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userInDb = await prismaClient.user.findUnique({
      where: { username: "test" },
    });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.is_verified).toBe(false);
    expect(userInDb?.verify_token).toBeDefined();
    expect(userInDb?.verify_token).not.toBeNull();
  });
});
