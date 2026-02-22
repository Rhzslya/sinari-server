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
    await UserTest.deleteGoogleDuplicate();
  });

  it("should register user", async () => {
    const requestBody: CreateUserRequest = {
      email: "test@gmail.com",
      username: "test",
      password: "@Adm1n5123",
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
      username: "test_customer",
      password: "@Adm1n5123",
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
  }, 15000);

  it("should reject register new user if email already exists", async () => {
    await UserTest.create();

    const requestBody: CreateUserRequest = {
      email: "test_customer@gmail.com",
      username: "test12",
      password: "@Adm1n5123",
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
  }, 15000);

  it("should reject register if email format is invalid", async () => {
    const requestBody: CreateUserRequest = {
      email: "invalid-email-format",
      username: "test",
      password: "password123",
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

  it("should reject register if password is too short", async () => {
    const requestBody: CreateUserRequest = {
      email: "test2@gmail.com",
      username: "test2",
      password: "123",
      name: "test2",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody,
    );

    const body = await response.json();
    console.log(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should silently fail (return 200 but NOT save to DB) if honeypot field is filled by bot", async () => {
    const requestBody: CreateUserRequest = {
      email: "bot_spammer@gmail.com",
      username: "bot_spammer",
      password: "@Adm1n5123",
      name: "Bot User",
      secondary_number: "08123456789",
    };

    const response = await TestRequest.post<CreateUserRequest>(
      "/api/users",
      requestBody,
    );

    const body = await response.json();
    logger.debug(body);

    expect(response.status).toBe(200);

    expect(body.data.email).toBe("bot_spammer@gmail.com");
    expect(body.data.username).toBe("bot_spammer");
    expect(body.data.name).toBe("Bot User");
    expect(body.data.id).toBeDefined();

    const userInDb = await prismaClient.user.findUnique({
      where: {
        email: "bot_spammer@gmail.com",
      },
    });

    expect(userInDb).toBeNull();
  }, 15000);
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  it("should login user if email and password is correct and verify user", async () => {
    const requestBody: LoginUserRequest = {
      identifier: "test_customer@gmail.com",
      password: "@Adm1n5123",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test_customer@gmail.com");
    expect(body.data.username).toBe("test_customer");
    expect(body.data.name).toBe("test");
  });

  it("should login user if username and password is correct", async () => {
    const requestBody: LoginUserRequest = {
      identifier: "test_customer",
      password: "@Adm1n5123",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test_customer@gmail.com");
    expect(body.data.username).toBe("test_customer");
    expect(body.data.name).toBe("test");
  });

  it("should reject login if email is not verified", async () => {
    await UserTest.unverify();

    const requestBody: LoginUserRequest = {
      identifier: "test_customer@gmail.com",
      password: "@Adm1n5123",
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

  it("should reject if user is banned", async () => {
    await UserTest.ban();

    const requestBody: LoginUserRequest = {
      identifier: "test_customer",
      password: "@Adm1n5123",
    };

    const response = await TestRequest.post<LoginUserRequest>(
      "/api/auth/login",
      requestBody,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBe(
      "Access denied. Your account is no longer active.",
    );
  });

  it("should reject login if username is wrong", async () => {
    const requestBody: LoginUserRequest = {
      identifier: "wrong",
      password: "@Adm1n5123",
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
      identifier: "wrong@gmail.com",
      password: "@Adm1n5123",
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
      identifier: "test_customer@gmail.com",
      password: "wrong123123",
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
      identifier: "",
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
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should get current user", async () => {
    const user = await UserTest.getCustomer();
    token = user.token!;

    const response = await TestRequest.get("/api/users/current", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("test_customer@gmail.com");
    expect(body.data.username).toBe("test_customer");
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
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should patch user name", async () => {
    const user = await UserTest.getCustomer();
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
    const user = await UserTest.getCustomer();
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
      password: "@Adm1n51232",
      current_password: "@Adm1n5123",
    };

    // 1. Ambil user awal cuma buat dapetin token
    let user = await UserTest.getCustomer();
    token = user.token!;

    const response = await TestRequest.patch(
      "/api/users/current",
      updateData,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const updatedUser = await UserTest.getCustomer();

    expect(await bcrypt.compare("@Adm1n51232", updatedUser.password!)).toBe(
      true,
    );
  });

  it("should reject patch user password if current password is missing", async () => {
    const updateData: UpdateUserRequest = {
      password: "@Adm1n51232",
      // current_password: "",
    };

    const user = await UserTest.getCustomer();
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
    const user = await UserTest.getCustomer();
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
      email: "test_customer@gmail.com",
    };

    const user = await UserTest.getCustomer();
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

describe("GET /api/users", () => {
  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should get users", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.get("/api/users", token);
    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.data.length).toBe(1);
  });

  it("should reject request with invalid token", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.get("/api/users", "wrong_token");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject request if no token provided", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.get("/api/users");

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject request if token is expired", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await UserTest.delete();

    const response = await TestRequest.get("/api/users", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject if user not admin", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    const response = await TestRequest.get("/api/users", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject request if user is banned", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await UserTest.banAdmin();

    const response = await TestRequest.get("/api/users", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });
});

describe("DELETE /api/users/logout", () => {
  beforeEach(async () => {
    await UserTest.create();
  });

  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should logout user", async () => {
    const user = await UserTest.getCustomer();
    token = user.token!;

    const response = await TestRequest.delete("/api/users/logout", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data).toBe("OK");

    const userAfterLogout = await UserTest.getCustomer();

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
    await UserTest.deleteGoogleDuplicate();
  });

  it("should verify user", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test_customer@gmail.com",
      username: "test_customer",
      password: "@Adm1n5123",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userBefore = await prismaClient.user.findFirst({
      where: {
        username: "test_customer",
      },
    });

    const token = userBefore?.verify_token;

    expect(token).toBeTruthy();

    const response = await TestRequest.get(`/api/auth/verify?token=${token}`);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);

    const userAfter = await prismaClient.user.findUnique({
      where: { username: "test_customer" },
    });

    expect(userAfter?.is_verified).toBe(true);
    expect(userAfter?.verify_token).toBeNull();
  }, 15000);

  it("should create user with unverified status ", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test_customer@gmail.com",
      username: "test_customer",
      password: "@Adm1n5123",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userInDb = await prismaClient.user.findUnique({
      where: { username: "test_customer" },
    });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.is_verified).toBe(false);
    expect(userInDb?.verify_token).toBeDefined();
    expect(userInDb?.verify_token).not.toBeNull();
  }, 15000);

  it("should reject verification if token is expired", async () => {
    await UserTest.delete();

    const requestBody: CreateUserRequest = {
      email: "test_customer@gmail.com",
      username: "test_customer",
      password: "@Adm1n5123",
      name: "test",
    };

    await TestRequest.post("/api/users", requestBody);

    const userBefore = await prismaClient.user.findFirst({
      where: { username: "test_customer" },
    });

    const token = userBefore?.verify_token;
    expect(token).toBeTruthy();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await prismaClient.user.update({
      where: { username: "test_customer" },
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

    const invalidToken = "wrong-token";

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
    await UserTest.deleteGoogleDuplicate();
  });

  it("should send forgot password email", async () => {
    await UserTest.create();

    const requestBody: ForgotPasswordRequest = {
      identifier: "test_customer@gmail.com",
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
      identifier: "test_customer",
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
    await UserTest.deleteGoogleDuplicate();
  });

  it("should reset password successfully", async () => {
    await UserTest.createAdmin();

    const requestBody: ForgotPasswordRequest = {
      identifier: "test_admin",
    };

    await TestRequest.post<ForgotPasswordRequest>(
      "/api/auth/forgot-password",
      requestBody,
    );

    await new Promise((res) => setTimeout(res, 1000));

    const userWithToken = await prismaClient.user.findUnique({
      where: { username: "test_admin" },
    });

    const token = userWithToken?.password_reset_token;
    expect(token).toBeTruthy();

    const newPassword = "@NewPassword123";

    const resetResponse = await TestRequest.patch("/api/auth/reset-password", {
      token: token,
      new_password: newPassword,
      confirm_new_password: newPassword,
    });

    const body = await resetResponse.json();
    logger.debug(body);

    expect(resetResponse.status).toBe(200);

    const userAfterReset = await prismaClient.user.findUnique({
      where: { username: "test_admin" },
    });

    expect(userAfterReset?.password_reset_token).toBeNull();
    expect(userAfterReset?.password_reset_expires_at).toBeNull();

    const isOldPasswordValid = await bcrypt.compare(
      "@Adm1n5123",
      userAfterReset!.password!,
    );
    expect(isOldPasswordValid).toBe(false);

    const isNewPasswordValid = await bcrypt.compare(
      newPassword,
      userAfterReset!.password!,
    );
    expect(isNewPasswordValid).toBe(true);
  }, 30000);

  it("should reject reset password request if token is expired", async () => {
    await UserTest.create();

    const expiredToken = "expired-token";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await prismaClient.user.update({
      where: { username: "test_customer" },
      data: {
        password_reset_token: expiredToken,
        password_reset_expires_at: oneHourAgo,
      },
    });

    const newPassword = "@NewPassword123";
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
    const newPassword = "@NewPassword123";

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

describe("DELETE /api/users/:id", () => {
  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should delete user", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    await UserTest.create();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.delete(
      `/api/users/${targetUser.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.message).toBe(
      `User With ID ${targetUser.id} deleted successfully`,
    );
  });

  it("should reject request with invalid token", async () => {
    await UserTest.createOwner();
    await UserTest.create();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.delete(
      `/api/users/${targetUser.id}`,
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject request if no token provided", async () => {
    await UserTest.createOwner();
    await UserTest.create();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.delete(`/api/users/${targetUser.id}`);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  it("should reject delete if user tries to delete their own account", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.delete(`/api/users/${user.id}`, token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("should reject if ADMIN tries to delete another ADMIN", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await UserTest.createAdminGoogle();

    const targetUser = await UserTest.findByEmail(
      "test_admin_google@gmail.com",
    );

    // 4. Lakukan request delete
    const response = await TestRequest.delete(
      `/api/users/${targetUser!.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject if ADMIN tries to delete an OWNER", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    await UserTest.createOwner();
    const targetUser = await UserTest.getOwner();

    const response = await TestRequest.delete(
      `/api/users/${targetUser.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject if OWNER tries to delete another OWNER", async () => {
    await UserTest.createOwner();
    const user = await UserTest.getOwner();
    token = user.token!;

    await UserTest.createOwnerGoogle();
    const targetUser = await UserTest.findByEmail(
      "test_owner_google@gmail.com",
    );

    const response = await TestRequest.delete(
      `/api/users/${targetUser!.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject if user not admin or owner", async () => {
    await UserTest.create();
    const user = await UserTest.getCustomer();
    token = user.token!;

    await UserTest.createGoogleDuplicate();
    const targetUser = await UserTest.findByEmail("test123@gmail.com");

    const response = await TestRequest.delete(
      `/api/users/${targetUser!.id}`,
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject if target user is not found", async () => {
    await UserTest.createAdmin();
    const user = await UserTest.getAdmin();
    token = user.token!;

    const response = await TestRequest.delete("/api/users/999999", token);

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });
});

describe("PATCH /api/users/:id/restore", () => {
  afterEach(async () => {
    await UserTest.delete();
    await UserTest.deleteGoogleDuplicate();
  });

  let token = "";

  it("should successfully restore a deleted user if requester is OWNER", async () => {
    token = await UserTest.createOwner();

    await UserTest.create();
    await UserTest.ban();

    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.patch(
      `/api/users/${targetUser.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(200);
    expect(body.data.email).toBe(targetUser.email);
    expect(body.data.username).toBe(targetUser.username);

    const checkRestoredUser = await prismaClient.user.findUnique({
      where: { id: targetUser.id },
    });
    expect(checkRestoredUser?.deleted_at).toBeNull();
  }, 15000);

  it("should reject restore if user is NOT in the trash bin (Active User)", async () => {
    token = await UserTest.createOwner();

    await UserTest.create();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.patch(
      `/api/users/${targetUser.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject restore if requester is ADMIN (Insufficient Permission)", async () => {
    token = await UserTest.createAdmin();

    await UserTest.create();
    await UserTest.ban();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.patch(
      `/api/users/${targetUser.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBe("Forbidden: Insufficient permissions");
  });

  it("should reject restore if requester is a regular CUSTOMER", async () => {
    token = await UserTest.create();

    const targetUser = await prismaClient.user.create({
      data: {
        email: "target_banned@gmail.com",
        username: "target_banned",
        password: "password",
        name: "Target Banned",
        role: "CUSTOMER",
        deleted_at: new Date(),
      },
    });

    const response = await TestRequest.patch(
      `/api/users/${targetUser.id}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(403);
    expect(body.errors).toBeDefined();
  });

  it("should reject restore if target user is not found at all", async () => {
    token = await UserTest.createOwner();
    const randomId = 999999;

    const response = await TestRequest.patch(
      `/api/users/${randomId}/restore`,
      {},
      token,
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(404);
    expect(body.errors).toBeDefined();
  });

  it("should reject request with invalid token", async () => {
    await UserTest.create();
    await UserTest.ban();
    const targetUser = await UserTest.getCustomer();

    const response = await TestRequest.patch(
      `/api/users/${targetUser.id}/restore`,
      {},
      "wrong_token",
    );

    const body = await response.json();

    logger.debug(body);

    expect(response.status).toBe(401);
    expect(body.errors).toBeDefined();
  });

  describe("PATCH /api/users/:id/restore", () => {
    afterEach(async () => {
      await UserTest.delete();
      await UserTest.deleteGoogleDuplicate();
      await prismaClient.user.deleteMany({
        where: { username: { contains: "target" } },
      });
    });

    let token = "";

    it("should successfully restore a deleted user if requester is OWNER", async () => {
      token = await UserTest.createOwner();

      await UserTest.create();
      await UserTest.ban();

      const targetUser = await UserTest.getCustomer();

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.email).toBe(targetUser.email);
      expect(body.data.username).toBe(targetUser.username);

      const checkRestoredUser = await prismaClient.user.findUnique({
        where: { id: targetUser.id },
      });
      expect(checkRestoredUser?.deleted_at).toBeNull();
    }, 15000);

    it("should reject restore if user is NOT in the trash bin (Active User)", async () => {
      token = await UserTest.createOwner();

      await UserTest.create();
      const targetUser = await UserTest.getCustomer();

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(404);
      expect(body.errors).toBeDefined();
    });

    it("should reject restore if requester is ADMIN (Insufficient Permission)", async () => {
      token = await UserTest.createAdmin();

      await UserTest.create();
      await UserTest.ban();
      const targetUser = await UserTest.getCustomer();

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(403);
      expect(body.errors).toBe("Forbidden: Insufficient permissions");
    });

    it("should reject restore if requester is a regular CUSTOMER", async () => {
      token = await UserTest.create();

      const targetUser = await prismaClient.user.create({
        data: {
          email: "target_banned@gmail.com",
          username: "target_banned",
          password: "password",
          name: "Target Banned",
          role: "CUSTOMER",
          deleted_at: new Date(),
        },
      });

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(403);
      expect(body.errors).toBeDefined();
    });

    it("should reject restore if target user is not found at all", async () => {
      token = await UserTest.createOwner();
      const randomId = 999999;

      const response = await TestRequest.patch(
        `/api/users/${randomId}/restore`,
        {},
        token,
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(404);
      expect(body.errors).toBeDefined();
    });

    it("should reject request with invalid token", async () => {
      await UserTest.create();
      await UserTest.ban();
      const targetUser = await UserTest.getCustomer();

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
        "wrong_token",
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(401);
      expect(body.errors).toBeDefined();
    });

    it("should reject request if no token provided", async () => {
      await UserTest.create();
      await UserTest.ban();
      const targetUser = await UserTest.getCustomer();

      const response = await TestRequest.patch(
        `/api/users/${targetUser.id}/restore`,
        {},
      );

      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(401);
      expect(body.errors).toBeDefined();
    });
  });
});
