import type { User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { web } from "../application/web";
import bcrypt from "bcrypt";
export class UserTest {
  static async delete() {
    await prismaClient.user.deleteMany({
      where: {
        username: {
          contains: "test",
        },
      },
    });
  }

  static async create() {
    const password = await bcrypt.hash("test", 10);
    await prismaClient.user.create({
      data: {
        email: "test@gmail.com",
        username: "test",
        password: password,
        name: "test",
        token: "test_token",
        is_verified: true,
        verify_token: null,
      },
    });
  }

  static async get(): Promise<User> {
    const user = await prismaClient.user.findFirst({
      where: {
        username: "test",
      },
    });

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async createGoogleDuplicate() {
    await prismaClient.user.create({
      data: {
        email: "test123@gmail.com",
        username: "test",
        name: "test",
        google_id: "123123123",
        token: "test_token",
      },
    });
  }

  static async deleteGoogleDuplicate() {
    await prismaClient.user.deleteMany({
      where: {
        email: {
          in: ["test123@gmail.com", "test@gmail.com"],
        },
      },
    });
  }

  static async unverify() {
    await prismaClient.user.update({
      where: {
        username: "test",
      },
      data: {
        is_verified: false,
        verify_token: null,
      },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await prismaClient.user.findUnique({
      where: {
        email: email,
      },
    });
  }
}

export class TestRequest {
  static async post<T>(
    url: string,
    body: T,
    token?: string
  ): Promise<Response> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    return web.request(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  static async get(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    return web.request(url, {
      method: "GET",
      headers: new Headers(headers),
    });
  }

  static async update<T>(
    url: string,
    body: T,
    token: string
  ): Promise<Response> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    return web.request(url, {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  static async delete(url: string, token: string): Promise<Response> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    return web.request(url, {
      method: "DELETE",
      headers: headers,
    });
  }
}
