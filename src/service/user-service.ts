import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ResponseError } from "../error/response-error";
import {
  toEmailVerificationResponse,
  toForgotPasswordResponse,
  toNotPublicUserResponse,
  toUserResponse,
  toUserResponseWithToken,
  type CreateUserRequest,
  type CreateUserWithGoogleRequest,
  type EmailVerificationResponse,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
  type NotPublicUserResponse,
  type LoginUserRequest,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type SearchUserRequest,
  type UpdateRoleRequest,
  type UpdateUserRequest,
  type UserResponse,
  type DetailedUserResponse,
  toDetailedUserResponse,
  type RestoreUserRequest,
} from "../model/user-model";
import { GoogleAuth } from "../utils/google-auth";
import { UserValidation } from "../validation/user-validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import {
  UserRole,
  type Prisma,
  type User,
} from "../../generated/prisma/client";
import type { GooglePayload } from "../type/google-type";
import { Mail } from "../utils/mail";
import { sign } from "hono/jwt";
import type { Pageable } from "../model/page-model";
import { redis } from "../lib/redis";

export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    const registerRequest = Validation.validate(
      UserValidation.REGISTER,
      request,
    );

    const totalUserWithSameUsername = await prismaClient.user.count({
      where: {
        username: registerRequest.username,
      },
    });

    const totalUserWithSameEmail = await prismaClient.user.count({
      where: {
        email: registerRequest.email,
      },
    });

    if (totalUserWithSameUsername != 0) {
      throw new ResponseError(400, "Username already registered");
    }

    if (totalUserWithSameEmail != 0) {
      throw new ResponseError(400, "Email already registered");
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    const verifyToken = uuid();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    const user = await prismaClient.user.create({
      data: {
        ...registerRequest,
        verify_token: verifyToken,
        is_verified: false,
        verify_expires_at: expiresAt,
      },
    });

    await Mail.sendVerificationMail(
      user.email!,
      user.verify_token!,
      user.name!,
    );

    return toUserResponse(user);
  }

  static async login(request: LoginUserRequest): Promise<UserResponse> {
    const loginRequest = Validation.validate(UserValidation.LOGIN, request);

    let user = await prismaClient.user.findFirst({
      where: {
        OR: [
          { email: loginRequest.identifier },
          { username: loginRequest.identifier },
        ],
      },
    });

    if (!user) {
      throw new ResponseError(401, "Username or password is wrong");
    }

    if (!user.password) {
      throw new ResponseError(
        400,
        "This account uses Google Login. Please sign in with Google.",
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new ResponseError(401, "Username or password is wrong");
    }

    if (!user.is_verified) {
      throw new ResponseError(
        403,
        "Your account is not verified. Please verify your email.",
      );
    }

    if (user.deleted_at !== null) {
      throw new ResponseError(
        403,
        "Access denied. Your account is no longer active.",
      );
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const jwtToken = await sign(payload, process.env.JWT_SECRET!);

    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user = await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: jwtToken,
        token_expired_at: expiredAt,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
    });

    const response = toUserResponse({ ...user, token: jwtToken });
    return response;
  }

  static async checkUserExists(id: number): Promise<User> {
    const user = await prismaClient.user.findUnique({
      where: {
        id: id,
        deleted_at: null,
      },
    });
    if (!user) {
      throw new ResponseError(404, "User not found");
    }
    return user;
  }

  static async get(user: User): Promise<UserResponse> {
    return toUserResponse(user);
  }

  // UserService.ts

  static async getById(user: User, id: number): Promise<DetailedUserResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const targetUser = await this.checkUserExists(id);

    const isOnlineCheck = await redis.exists(`online_users:${targetUser.id}`);

    const userDetailed = toDetailedUserResponse(targetUser);

    return {
      ...userDetailed,
      is_online: isOnlineCheck === 1,
    };
  }

  static async update(
    user: User,
    request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const updateRequest = Validation.validate(UserValidation.UPDATE, request);

    if (updateRequest.email) {
      const isEmailCollision = await prismaClient.user.count({
        where: {
          email: updateRequest.email,
        },
      });

      if (isEmailCollision != 0) {
        throw new ResponseError(400, "Email already registered");
      }

      user.email = updateRequest.email!;
    }

    if (updateRequest.name) {
      user.name = updateRequest.name;
    }

    if (updateRequest.password) {
      if (user.password) {
        if (!updateRequest.current_password) {
          throw new ResponseError(400, "Please enter your current password");
        }

        const isCurrentPasswordCorrect = await bcrypt.compare(
          updateRequest.current_password,
          user.password,
        );

        if (!isCurrentPasswordCorrect) {
          throw new ResponseError(400, "Current password is wrong");
        }
      }

      updateRequest.password = await bcrypt.hash(updateRequest.password, 10);
    }

    delete updateRequest.current_password;

    const result = await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: updateRequest,
    });

    return toUserResponse(result);
  }

  static async search(
    user: User,
    request: SearchUserRequest,
  ): Promise<Pageable<UserResponse>> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const searchRequest = Validation.validate(UserValidation.SEARCH, request);

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const andFilters: Prisma.UserWhereInput[] = [];

    if (searchRequest.name) {
      andFilters.push({
        OR: [
          { name: { contains: searchRequest.name } },
          { username: { contains: searchRequest.username } },
        ],
      });
    }

    if (searchRequest.role) {
      andFilters.push({
        role: searchRequest.role,
      });
    }

    if (searchRequest.is_online !== undefined) {
      const keys = await redis.keys("online_users:*");
      const onlineIds = keys
        .map((key) => Number(key.split(":")[1]))
        .filter((id) => !isNaN(id));

      if (searchRequest.is_online === true) {
        if (onlineIds.length > 0) {
          andFilters.push({ id: { in: onlineIds } });
        } else {
          andFilters.push({ id: -1 });
        }
      } else {
        if (onlineIds.length > 0) {
          andFilters.push({ id: { notIn: onlineIds } });
        }
      }
    }

    const whereClause: Prisma.UserWhereInput = {
      deleted_at: searchRequest.is_deleted ? { not: null } : null,
      AND: andFilters,
    };

    const users = await prismaClient.user.findMany({
      where: whereClause,
      take: searchRequest.size,
      skip: skip,
      orderBy: {
        [searchRequest.sort_by || "created_at" || "name"]:
          searchRequest.sort_order || "desc",
      },
    });

    const totalItems = await prismaClient.user.count({
      where: whereClause,
    });

    const data = await Promise.all(
      users.map(async (user) => {
        const isOnline = await redis.exists(`online_users:${user.id}`);

        const userResponse = toNotPublicUserResponse(user);

        return {
          ...userResponse,
          is_online: isOnline === 1,
        };
      }),
    );

    return {
      data: data,
      paging: {
        size: searchRequest.size,
        current_page: searchRequest.page,
        total_page: Math.ceil(totalItems / searchRequest.size),
      },
    };
  }

  static async updateRole(
    user: User,
    request: UpdateRoleRequest,
  ): Promise<NotPublicUserResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRoleRequest = Validation.validate(
      UserValidation.UPDATE_ROLE,
      request,
    );

    if (user.id === updateRoleRequest.id) {
      throw new ResponseError(400, "You cannot update your own role");
    }

    const targetUser = await prismaClient.user.findUnique({
      where: {
        id: updateRoleRequest.id,
      },
    });

    if (!targetUser) {
      throw new ResponseError(404, "User not found");
    }

    const rootOwner = process.env.ROOT_OWNER;

    if (targetUser.email === rootOwner) {
      throw new ResponseError(
        403,
        "SECURITY ALERT: You cannot modify the Root Owner account.",
      );
    }

    if (
      targetUser.role === UserRole.OWNER &&
      updateRoleRequest.role !== UserRole.OWNER
    ) {
      const totalOwners = await prismaClient.user.count({
        where: { role: UserRole.OWNER },
      });

      if (totalOwners <= 1) {
        throw new ResponseError(409, "Cannot demote the last remaining Owner.");
      }
    }

    const updateUserRole = await prismaClient.user.update({
      where: {
        id: updateRoleRequest.id,
      },
      data: {
        role: updateRoleRequest.role,
      },
    });

    const isOnline = await redis.exists(`online_users:${targetUser.id}`);

    const response = toNotPublicUserResponse(updateUserRole);

    return {
      ...response,
      is_online: isOnline === 1,
    };
  }

  static async logout(user: User): Promise<UserResponse> {
    const result = await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: null,
      },
    });

    return toUserResponse(result);
  }

  static async checkUserExist(id: number): Promise<UserResponse> {
    const user = await prismaClient.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    return user;
  }

  static async removeUser(user: User, id: number): Promise<boolean> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    if (user.id === id) {
      throw new ResponseError(400, "You cannot delete your own account");
    }

    const targetUser = await prismaClient.user.findUnique({
      where: { id: id },
    });

    if (!targetUser) {
      throw new ResponseError(404, "User not found");
    }

    if (targetUser.deleted_at !== null) {
      throw new ResponseError(400, "User is already deleted");
    }

    if (user.role === UserRole.ADMIN) {
      if (
        targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.OWNER
      ) {
        throw new ResponseError(
          403,
          "Forbidden: Admins cannot delete other Admins or Owners",
        );
      }
    }

    if (user.role === UserRole.OWNER) {
      if (targetUser.role === UserRole.OWNER) {
        throw new ResponseError(
          403,
          "Forbidden: Owners cannot delete other Owners",
        );
      }
    }

    await prismaClient.user.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
        token: null,
      },
    });

    return true;
  }

  static async restoreUser(
    user: User,
    request: RestoreUserRequest,
  ): Promise<NotPublicUserResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const restoreRequest = Validation.validate(UserValidation.RESTORE, request);

    const userInTrash = await prismaClient.user.findFirst({
      where: {
        id: restoreRequest.id,
        deleted_at: { not: null },
      },
    });

    if (!userInTrash) {
      throw new ResponseError(
        404,
        "User not found in trash bin. It might be active or permanently deleted.",
      );
    }

    const restoredUser = await prismaClient.user.update({
      where: {
        id: restoreRequest.id,
      },
      data: {
        deleted_at: null,
      },
    });

    await Mail.sendRestoredUser(restoredUser.email!, restoredUser.name!);

    return toNotPublicUserResponse(restoredUser);
  }

  static async loginWithGoogle(
    request: CreateUserWithGoogleRequest,
  ): Promise<UserResponse> {
    // 1. DATA VALIDATION
    const validatedRequest = Validation.validate(
      UserValidation.GOOGLE_LOGIN,
      request,
    );

    // 2. GOOGLE VERIFICATION TOKEN
    const googlePayload = await GoogleAuth.verifyToken(validatedRequest.token);

    if (!googlePayload) {
      throw new ResponseError(401, "Invalid Google Token");
    }

    // 3. SEARCH USER
    let user = await prismaClient.user.findUnique({
      where: { email: googlePayload.email },
    });

    // 4. MAIN
    if (user) {
      // Check Strict Separation
      if (!user.google_id) {
        throw new ResponseError(
          409,
          "Account exists. Please login with your password.",
        );
      }
      // Security check extra
      if (user.google_id !== googlePayload.google_id) {
        throw new ResponseError(409, "Account conflict. Google ID mismatch.");
      }
    } else {
      user = await this.registerNewGoogleUser(googlePayload);
    }

    // Safety check for TS
    if (!user) {
      throw new ResponseError(500, "Failed to process user data");
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const jwtToken = await sign(payload, process.env.JWT_SECRET!, "HS256");

    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user = await prismaClient.user.update({
      where: { id: user.id },
      data: {
        token: jwtToken,
        token_expired_at: expiredAt,
      },
    });

    return toUserResponseWithToken({ ...user, token: jwtToken });
  }

  // --- PRIVATE HELPER ---
  private static async registerNewGoogleUser(
    googlePayload: GooglePayload,
  ): Promise<User> {
    let username = googlePayload.email.split("@")[0];
    let isCreated = false;
    let retryCount = 0;

    // Initiation User | null
    let user: User | null = null;

    while (!isCreated && retryCount < 5) {
      try {
        user = await prismaClient.user.create({
          data: {
            google_id: googlePayload.google_id,
            email: googlePayload.email,
            username: username,
            name: googlePayload.name,
            password: null,
            role: UserRole.CUSTOMER,
            token: null,
            is_verified: true,
            verify_token: null,
          },
        });
        isCreated = true;
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          // P2002: Unique constraint failed
          if (error.code === "P2002") {
            const target = error.meta?.target;
            const message = error.message;

            // CHECK IF ERROR IS ABOUT GOOGLE_ID COLLISION
            const isGoogleIdCollision =
              (Array.isArray(target) && target.includes("google_id")) ||
              (typeof target === "string" && target.includes("google_id")) ||
              message.includes("users_google_id_key");

            if (isGoogleIdCollision) {
              throw new ResponseError(
                409,
                "This Google Account is already linked to another user.",
              );
            }

            // CHECK IF ERROR IS ABOUT USERNAME COLLISION
            const isUsernameCollision =
              (Array.isArray(target) && target.includes("username")) ||
              (typeof target === "string" && target.includes("username")) ||
              message.includes("users_username_key");

            if (isUsernameCollision) {
              const baseName = googlePayload.email.split("@")[0];
              username = `${baseName}-${Math.floor(
                1000 + Math.random() * 9000,
              )}`;

              logger.info(
                `Username collision detected. Retrying with: ${username}`,
              );

              retryCount++;
              continue;
            }
          }
        }
        throw error;
      }
    }

    if (!isCreated || !user) {
      throw new ResponseError(500, "Failed to create user unique username");
    }

    return user;
  }

  static async verify(token: string): Promise<boolean> {
    const user = await prismaClient.user.findFirst({
      where: {
        verify_token: token,
      },
    });

    if (!user) {
      throw new ResponseError(404, "Invalid or expired verification token");
    }

    if (user.verify_expires_at && new Date() > user.verify_expires_at) {
      throw new ResponseError(404, "Invalid or expired verification token");
    }

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        is_verified: true,
        verify_token: null,
        verify_expires_at: null,
      },
    });

    return true;
  }

  private static readonly TOKEN_DURATION_MS = 10 * 60 * 1000;

  private static readonly COOLDOWN_MS = 60 * 1000;

  private static readonly MAX_DAILY_RESEND = 5;

  static async resendVerificationMail(
    identifier: string,
  ): Promise<EmailVerificationResponse> {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (user.is_verified) {
      throw new ResponseError(400, "Account already verified");
    }

    let currentCount = user.resend_count;

    if (!user.last_resend_time) {
      const lastDateISO = new Date(user.last_resend_time!)
        .toISOString()
        .split("T")[0];
      const todayISO = new Date().toISOString().split("T")[0];

      if (lastDateISO !== todayISO) {
        currentCount = 0;
      }
    }

    if (currentCount >= this.MAX_DAILY_RESEND) {
      throw new ResponseError(
        429,
        `Daily limit reached (${this.MAX_DAILY_RESEND}/${this.MAX_DAILY_RESEND}). Please try again tomorrow.`,
      );
    }

    if (user.verify_expires_at) {
      const lastTokenCreatedAt =
        user.verify_expires_at.getTime() - this.TOKEN_DURATION_MS;

      const timeSinceLastRequest = Date.now() - lastTokenCreatedAt;

      if (timeSinceLastRequest < this.COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (this.COOLDOWN_MS - timeSinceLastRequest) / 1000,
        );
        throw new ResponseError(
          400,
          `Please wait ${remainingSeconds} seconds before resending.`,
        );
      }
    }

    const newVerifyToken = uuid();

    const expiresAt = new Date(Date.now() + this.TOKEN_DURATION_MS);

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        verify_token: newVerifyToken,
        verify_expires_at: expiresAt,
        resend_count: currentCount + 1,
        last_resend_time: new Date(),
      },
    });

    await Mail.sendVerificationMail(user.email!, newVerifyToken, user.name!);

    return toEmailVerificationResponse(user.email!);
  }

  private static readonly PASS_RESET_MAX_DAILY = 5;

  private static readonly PASS_RESET_COOLDOWN_MS = 60 * 1000;

  static async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    const forgotPasswordRequest = Validation.validate(
      UserValidation.FORGOT_PASSWORD,
      request,
    );

    const identifier = forgotPasswordRequest.identifier;

    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (user.google_id && !user.password) {
      throw new ResponseError(
        400,
        "This account uses Google Login. Please sign in with Google.",
      );
    }

    let currentCount = user.pass_reset_count;

    if (user.pass_reset_last_time) {
      const lastDateISO = new Date(user.pass_reset_last_time)
        .toISOString()
        .split("T")[0];
      const todayISO = new Date().toISOString().split("T")[0];

      if (lastDateISO !== todayISO) {
        currentCount = 0;
      }
    }

    if (currentCount >= this.PASS_RESET_MAX_DAILY) {
      throw new ResponseError(
        429,
        `Daily reset limit reached. Please try again tomorrow.`,
      );
    }

    if (user.pass_reset_last_time) {
      const timeSinceLastRequest =
        Date.now() - new Date(user.pass_reset_last_time).getTime();

      if (timeSinceLastRequest < this.PASS_RESET_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (this.PASS_RESET_COOLDOWN_MS - timeSinceLastRequest) / 1000,
        );
        throw new ResponseError(
          429,
          `Please wait ${remainingSeconds} seconds before requesting another link.`,
        );
      }
    }

    const resetToken = uuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        password_reset_token: resetToken,
        password_reset_expires_at: expiresAt,
        pass_reset_count: currentCount + 1,
        pass_reset_last_time: new Date(),
      },
    });

    await Mail.sendPasswordResetMail(user.email!, resetToken, user.name!);

    return toForgotPasswordResponse(user.email!);
  }

  static async resetPassword(
    request: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const resetPasswordRequest = Validation.validate(
      UserValidation.RESET_PASSWORD,
      request,
    );

    const user = await prismaClient.user.findFirst({
      where: {
        password_reset_token: resetPasswordRequest.token,
      },
    });

    if (!user) {
      throw new ResponseError(400, "Invalid or expired password reset token");
    }

    if (
      user.password_reset_expires_at &&
      new Date() > user.password_reset_expires_at
    ) {
      throw new ResponseError(400, "Invalid or expired password reset token");
    }

    const newPasswordHash = await bcrypt.hash(
      resetPasswordRequest.new_password,
      10,
    );

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: newPasswordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        is_verified: true,
      },
    });

    return {
      message:
        "Password has been successfully reset. Please login with your new password.",
    };
  }
}
