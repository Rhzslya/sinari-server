import type { Context } from "hono";
import type {
  CreateUserRequest,
  CreateUserWithGoogleRequest,
  LoginUserRequest,
  UpdateUserRequest,
} from "../model/user-model";
import { UserService } from "../service/user-service";
import type { ApplicationVariables } from "../type/hono-context";

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

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }

  static async get(c: Context<{ Variables: ApplicationVariables }>) {
    try {
      const user = c.var.user;

      const response = await UserService.get(user);

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

  static async logout(c: Context) {
    try {
      const user = c.var.user;

      await UserService.logout(user);

      return c.json({ data: "OK" });
    } catch (error) {
      throw error;
    }
  }

  static async loginWithGoogle(c: Context) {
    try {
      const request = (await c.req.json()) as CreateUserWithGoogleRequest;

      const response = await UserService.loginWithGoogle(request);

      return c.json({ data: response });
    } catch (error) {
      throw error;
    }
  }
}
