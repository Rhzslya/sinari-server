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

  static async createAdmin() {
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
        role: "admin",
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

  static async createAdminGoogle() {
    const password = await bcrypt.hash("test", 10);
    await prismaClient.user.create({
      data: {
        google_id: "123123123",
        email: "test@gmail.com",
        username: "test",
        password: password,
        name: "test",
        token: "test_token",
        is_verified: true,
        verify_token: null,
        role: "admin",
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

export class ServiceTest {
  static async deleteAll() {
    await prismaClient.service.deleteMany({
      where: {
        brand: {
          contains: "test",
        },
      },
    });
  }

  static async create() {
    return await prismaClient.service.create({
      data: {
        brand: "test",
        model: "test",
        customer_name: "test",
        phone_number: "08123123123",
        description: "test",
        technician_note: "test",
        status: "pending",
        service_list: {
          create: [
            {
              name: "test",
              price: 1000,
            },
          ],
        },
        discount: 0,
        total_price: 1000,
        tracking_token: "test_token",
      },
    });
  }
}

export class UserTestRequest {
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

export class ServiceTestRequest {
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

  static async update<T>(
    url: string,
    headers: Record<string, string>,
    body: T
  ): Promise<Response> {
    return web.request(url, {
      method: "PATCH",
      headers: new Headers({
        ...headers,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
  }
}
