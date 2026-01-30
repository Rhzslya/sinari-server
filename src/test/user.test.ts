import { describe, afterEach, beforeEach, it, expect } from "bun:test";
import { TestRequest, UserTest } from "./test-utils";
import { logger } from "../application/logging";
import type {
  CreateUserRequest,
  ForgotPasswordRequest,
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
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  }, 15000);

  it("it should reject register new user if request is invalid", async () => {
    const requestBody: CreateUserRequest = {
      email: "",
      username: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody,
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
      requestBody,
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
      requestBody,
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
      requestBody,
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
      requestBody,
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
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBe(
      "Your account is not verified. Please verify your email.",
    );
  });

  it("should reject login if username is wrong", async () => {
    const requestBody: LoginUserRequest = {
      username: "wrong",
      password: "test",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody,
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
      requestBody,
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
      requestBody,
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
      requestBody,
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

  let token = "";

  it("should get current user", async () => {
    const user = await UserTest.get();
    token = user.token!;

    const response = await TestRequest.get("/api/users/current", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test@gmail.com");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
  });

  it("should reject user if token is invalid", async () => {
    const response = await TestRequest.get("/api/users/current", "wrong_token");
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

  let token = "";

  it("should patch user name", async () => {
    const user = await UserTest.get();
    token = user.token!;

    const updateData: UpdateUserRequest = {
      name: "test2",
    };

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("test2");
  });

  it("should patch user email if email not exists in database", async () => {
    const user = await UserTest.get();
    token = user.token!;

    const updateData: UpdateUserRequest = {
      email: "test2@gmail.com",
    };

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test2@gmail.com");
  });

  it("should patch user password", async () => {
    const updateData: UpdateUserRequest = {
      password: "test2",
      current_password: "test",
    };

    // 1. Ambil user awal cuma buat dapetin token
    let user = await UserTest.get();
    token = user.token!;

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const updatedUser = await UserTest.get();

    expect(await bcrypt.compare("test2", updatedUser.password!)).toBe(true);
  });

  it("should reject patch user password if current password is missing", async () => {
    const updateData: UpdateUserRequest = {
      password: "test2",
      // current_password: "",
    };

    const user = await UserTest.get();
    token = user.token!;

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(await bcrypt.compare("test2", user.password!)).toBe(false);
  });

  it("should reject patch if data is null", async () => {
    const user = await UserTest.get();
    token = user.token!;

    const updateData: UpdateUserRequest = {
      email: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject patch token is wrong", async () => {
    const updateData: UpdateUserRequest = {
      email: "",
      password: "",
      name: "",
    };

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject patch user email if email is exists in database", async () => {
    const updateData: UpdateUserRequest = {
      email: "test@gmail.com",
    };

    const user = await UserTest.get();
    token = user.token!;

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });
});

describe("DELETE /api/users/logout", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
  });

  let token = "";

  it("should logout user", async () => {
    const user = await UserTest.get();
    token = user.token!;

    const response = await TestRequest.delete("/api/users/logout", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data).toBe("OK");

    const userAfterLogout = await UserTest.get();

    expect(userAfterLogout.token).toBeNull();
  });

  it("should reject logout user if token is wrong", async () => {
    const response = await TestRequest.delete(
      "/api/users/logout",
      "wrong_token",
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

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const userAfter = await prismaClient.user.findUnique({
      where: { username: "test" },
    });

    expect(userAfter?.is_verified).toBe(true);
    expect(userAfter?.verify_token).toBeNull();
  }, 15000);

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
  }, 15000);

  it("should reject verification if token is expired", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "test",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userBefore = await prismaClient.user.findFirst({
      where: { username: "test" },
    });

    const token = userBefore?.verify_token;
    expect(token).toBeTruthy();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await prismaClient.user.update({
      where: { username: "test" },
      data: {
        verify_expires_at: oneHourAgo,
      },
    });

    const response = await TestRequest.get(`/api/auth/verify?token=${token}`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.errors).toBe("Invalid or expired verification token");
    expect(body.errors).toBeDefined();
  }, 15000);

  it("should reject verification if token is invalid", async () => {
    await UserTest.delete();

    const invalidToken = "token-palsu-ngawur-12345";

    const response = await TestRequest.get(
      `/api/auth/verify?token=${invalidToken}`,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });
});

describe("Forgot Password", () => {
  afterEach(async () => {
    await UserTest.delete();
  });

  it("should send forgot password email", async () => {
    await UserTest.create();

    const requestBody: ForgotPasswordRequest = {
      identifier: "test@gmail.com",
    };

    const response = await TestRequest.post<ForgotPasswordRequest>(
      "/api/auth/forgot-password",
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.message).toBe(
      "Forgot password Request has been sent successfully",
    );
  }, 15000);

  it("should send forgot password with username identifier", async () => {
    await UserTest.create();

    const requestBody: ForgotPasswordRequest = {
      identifier: "test",
    };

    const response = await TestRequest.post<ForgotPasswordRequest>(
      "/api/auth/forgot-password",
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.message).toBe(
      "Forgot password Request has been sent successfully",
    );
  }, 15000);
});

describe("Reset Password", () => {
  afterEach(async () => {
    await UserTest.delete();
  });

  it("should reset password successfully", async () => {
    await UserTest.create();

    await TestRequest.post<ForgotPasswordRequest>("/api/auth/forgot-password", {
      identifier: "test@gmail.com",
    });

    const userWithToken = await prismaClient.user.findUnique({
      where: { username: "test" },
    });

    const token = userWithToken?.password_reset_token;
    expect(token).toBeTruthy();

    const newPassword = "newPassword123";

    const resetResponse = await TestRequest.patch("/api/auth/reset-password", {
      token: token,
      new_password: newPassword,
      confirm_new_password: newPassword,
    });

    expect(resetResponse.status).toBe(200);
    const body = await resetResponse.json();

    logger.debug(body);

    expect(body.data.message).toBeDefined();

    const userAfterReset = await prismaClient.user.findUnique({
      where: { username: "test" },
    });

    expect(userAfterReset?.password_reset_token).toBeNull();
    expect(userAfterReset?.password_reset_expires_at).toBeNull();

    const isOldPasswordValid = await bcrypt.compare(
      "test",
      userAfterReset!.password!,
    );
    expect(isOldPasswordValid).toBe(false);

    const isNewPasswordValid = await bcrypt.compare(
      newPassword,
      userAfterReset!.password!,
    );
    expect(isNewPasswordValid).toBe(true);
  }, 15000);

  it("should reject reset password request if token is expired", async () => {
    await UserTest.create();

    const expiredToken = "token-sudah-basi-123";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await prismaClient.user.update({
      where: { username: "test" },
      data: {
        password_reset_token: expiredToken,
        password_reset_expires_at: oneHourAgo,
      },
    });

    const newPassword = "newPassword123";
    const response = await TestRequest.patch("/api/auth/reset-password", {
      token: expiredToken,
      new_password: newPassword,
      confirm_new_password: newPassword,
    });

    const body = await response.json();
    console.log("Response Expired Test:", body);

    expect(response.status).toBe(400);

    expect(body.errors).toBe("Invalid or expired password reset token");
  });

  it("should reject reset password request if token is invalid", async () => {
    await UserTest.create();

    const invalidToken = "wrong-token";
    const newPassword = "newPassword123";

    const response = await TestRequest.patch("/api/auth/reset-password", {
      token: invalidToken,
      new_password: newPassword,
      confirm_new_password: newPassword,
    });

    const body = await response.json();
    console.log("Response Invalid Token Test:", body);

    expect(response.status).toBe(400);

    expect(body.errors).toBeDefined();
  });
});
