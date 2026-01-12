import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ResponseError } from "../error/response-error";
import {
  toUserResponse,
  toUserResponseWithToken,
  type CreateUserRequest,
  type CreateUserWithGoogleRequest,
  type LoginUserRequest,
  type UpdateUserRequest,
  type UserResponse,
} from "../model/user-model";
import { GoogleAuth } from "../utils/google-auth";
import { UserValidation } from "../validation/user-validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import type { User } from "../../generated/prisma/client";
import type { GooglePayload } from "../type/google-type";

export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    const registerRequest = Validation.validate(
      UserValidation.REGISTER,
      request
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

    const user = await prismaClient.user.create({
      data: {
        ...registerRequest,
        verify_token: verifyToken,
        is_verified: false,
      },
    });

    return toUserResponse(user);
  }

  static async login(request: LoginUserRequest): Promise<UserResponse> {
    const loginRequest = Validation.validate(UserValidation.LOGIN, request);

    let user = await prismaClient.user.findFirst({
      where: {
        OR: [
          { email: loginRequest.email },
          { username: loginRequest.username },
        ],
      },
    });

    if (!user) {
      throw new ResponseError(401, "Username or password is wrong");
    }

    if (!user.is_verified) {
      throw new ResponseError(403, "Please verify your email address first");
    }

    if (!user.password) {
      throw new ResponseError(401, "Username or password is wrong");
    }

    const isPasswordCorrect = await bcrypt.compare(
      loginRequest.password,
      user.password!
    );
    if (!isPasswordCorrect) {
      throw new ResponseError(401, "Username or password is wrong");
    }

    logger.info(user.password);

    user = await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: uuid(),
      },
    });

    const response = toUserResponse(user);
    response.token = user.token!;
    return response;
  }

  static async get(user: User): Promise<UserResponse> {
    return toUserResponse(user);
  }

  static async update(
    user: User,
    request: UpdateUserRequest
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
          user.password
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

  static async loginWithGoogle(
    request: CreateUserWithGoogleRequest
  ): Promise<UserResponse> {
    // 1. DATA VALIDATION
    const validatedRequest = Validation.validate(
      UserValidation.GOOGLE_LOGIN,
      request
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
          `We found an existing account for '${googlePayload.email}'. Sign-in using your password.`
        );
      }

      // Security check extra
      if (user.google_id !== googlePayload.google_id) {
        throw new ResponseError(409, "Account conflict. Google ID mismatch.");
      }

      // Update Token Session
      user = await prismaClient.user.update({
        where: { id: user.id },
        data: { token: uuid() },
      });
    } else {
      // --- NEW USER SCENARIO ---
      user = await this.registerNewGoogleUser(googlePayload);
    }

    // Safety check for TS
    if (!user) {
      throw new ResponseError(500, "Failed to process user data");
    }

    return toUserResponseWithToken(user);
  }

  // --- PRIVATE HELPER ---
  private static async registerNewGoogleUser(
    googlePayload: GooglePayload
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
            role: "customer",
            token: uuid(),
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
                "This Google Account is already linked to another user."
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
                1000 + Math.random() * 9000
              )}`;

              logger.info(
                `Username collision detected. Retrying with: ${username}`
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

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        is_verified: true,
        verify_token: null,
      },
    });

    return true;
  }
}
