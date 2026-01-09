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

    const user = await prismaClient.user.create({
      data: registerRequest,
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

    if (!user || !user.password) {
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
          },
        });
        isCreated = true;
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          // P2002: Unique constraint failed
          if (error.code === "P2002") {
            const target = error.meta?.target;
            const message = error.message;

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
}
