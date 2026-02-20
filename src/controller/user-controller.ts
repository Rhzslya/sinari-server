import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type {
  CreateUserRequest,
  CreateUserWithGoogleRequest,
  ForgotPasswordRequest,
  LoginUserRequest,
  ResetPasswordRequest,
  SearchUserRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
} from "../model/user-model";
import { UserService } from "../service/user-service";
import type { ApplicationVariables } from "../type/hono-context";
import { ResponseError } from "../error/response-error";
import type { User, UserRole } from "../../generated/prisma/client";

export class UserController {
  static async register(c: Context) {
    try {
      const request = (await c.req.json()) as CreateUserRequest;

      const response = await UserService.register(request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async login(c: Context) {
    try {
      const request = (await c.req.json()) as LoginUserRequest;

      const response = await UserService.login(request);

      if (!response.token) {
        throw new ResponseError(500, "Failed to generate authentication token");
      }

      setCookie(c, "auth_token", response.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      const { token, ...safeResponse } = response;

      return c.json({ data: safeResponse });
    } catch (error) {
      throw error;
    }
  }

  static async get(c: Context<{ Variables: ApplicationVariables }>) {
    try {
      const user = c.var.user;

      const response = await UserService.get(user);

      const { token, ...safeResponse } = response;

      return c.json({ data: safeResponse });
    } catch (error) {
      throw error;
    }
  }

  static async getById(c: Context) {
    try {
      const user = c.var.user;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid user ID");
      }

      const response = await UserService.getById(user, { id });

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async update(c: Context) {
    try {
      const user = c.var.user;

      const request = (await c.req.json()) as UpdateUserRequest;

      const response = await UserService.update(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async search(c: Context) {
    try {
      const user = c.var.user as User;

      const isOnlineQuery = c.req.query("is_online");
      let isOnlineBoolean: boolean | undefined = undefined;

      if (isOnlineQuery === "true") {
        isOnlineBoolean = true;
      } else if (isOnlineQuery === "false") {
        isOnlineBoolean = false;
      }

      const request: SearchUserRequest = {
        name: c.req.query("name"),
        username: c.req.query("username"),
        is_deleted: c.req.query("is_deleted")
          ? c.req.query("is_deleted") === "true"
          : undefined,
        page: c.req.query("page") ? Number(c.req.query("page")) : 1,
        size: c.req.query("size") ? Number(c.req.query("size")) : 10,

        is_online: isOnlineBoolean,

        role: c.req.query("role") as UserRole,

        sort_by: c.req.query("sort_by") as "created_at" | "name",
        sort_order: c.req.query("sort_order") as "asc" | "desc",
      };

      const response = await UserService.search(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async updateRole(c: Context) {
    try {
      const user = c.var.user;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid user ID");
      }

      const request = (await c.req.json()) as UpdateRoleRequest;

      request.id = id;

      const response = await UserService.updateRole(user, request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async logout(c: Context) {
    try {
      const user = c.var.user;

      await UserService.logout(user);

      deleteCookie(c, "auth_token", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      return c.json({ data: "OK" });
    } catch (error) {
      throw error;
    }
  }

  static async removeUser(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid user ID");
      }

      await UserService.removeUser(user, { id });

      return c.json({
        data: true,
        message: `User With ID ${id} deleted successfully`,
      });
    } catch (error) {
      throw error;
    }
  }

  static async restore(c: Context) {
    try {
      const user = c.var.user as User;

      const id = Number(c.req.param("id"));

      if (isNaN(id)) {
        throw new ResponseError(400, "Invalid user ID");
      }

      const response = await UserService.restoreUser(user, { id });

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async loginWithGoogle(c: Context) {
    try {
      const request = (await c.req.json()) as CreateUserWithGoogleRequest;

      const response = await UserService.loginWithGoogle(request);

      if (!response.token) {
        throw new ResponseError(500, "Failed to generate authentication token");
      }

      setCookie(c, "auth_token", response.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      const { token, ...safeResponse } = response;

      return c.json({ data: safeResponse });
    } catch (error) {
      throw error;
    }
  }

  static async verify(c: Context) {
    try {
      const token = c.req.query("token");

      if (!token) {
        throw new ResponseError(400, "Token is required");
      }

      const response = await UserService.verify({ token });

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async resendVerification(c: Context) {
    try {
      const identifier = c.req.query("email") || c.req.query("username");

      if (!identifier) {
        throw new ResponseError(400, "Email or Username is required");
      }

      const response = await UserService.resendVerificationMail({ identifier });

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }

  static async forgotPassword(c: Context) {
    try {
      const request = (await c.req.json()) as ForgotPasswordRequest;

      const response = await UserService.forgotPassword(request);

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(c: Context) {
    try {
      const request = (await c.req.json()) as ResetPasswordRequest;

      const response = await UserService.resetPassword(request);

      return c.json({
        data: response,
      });
    } catch (error) {
      throw error;
    }
  }
}
