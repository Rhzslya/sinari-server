import {
  UserRole,
  type Service,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { web } from "../application/web";
import bcrypt from "bcrypt";
import { sign } from "hono/jwt";

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
    const user = await prismaClient.user.create({
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

    const payload = {
      id: user.id,
      username: user.username,
      role: "customer",
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const token = await sign(
      payload,
      process.env.JWT_SECRET || "secret",
      "HS256",
    );

    await prismaClient.user.update({
      where: { id: user.id },
      data: { token: token },
    });

    return token;
  }

  static async createAdmin(): Promise<string> {
    const password = await bcrypt.hash("test", 10);
    const user = await prismaClient.user.create({
      data: {
        email: "test@gmail.com",
        username: "test",
        password: password,
        name: "test",
        token: "test_token",
        is_verified: true,
        verify_token: null,
        role: UserRole.ADMIN,
      },
    });

    const payload = {
      id: user.id,
      username: user.username,
      role: UserRole.ADMIN,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const token = await sign(
      payload,
      process.env.JWT_SECRET || "secret",
      "HS256",
    );

    await prismaClient.user.update({
      where: { id: user.id },
      data: { token: token },
    });

    return token;
  }
  static async createOwner(): Promise<string> {
    const password = await bcrypt.hash("test", 10);
    const user = await prismaClient.user.create({
      data: {
        email: "test@gmail.com",
        username: "test",
        password: password,
        name: "test",
        token: "test_token",
        is_verified: true,
        verify_token: null,
        role: UserRole.OWNER,
      },
    });

    const payload = {
      id: user.id,
      username: user.username,
      role: UserRole.OWNER,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const token = await sign(
      payload,
      process.env.JWT_SECRET || "secret",
      "HS256",
    );

    await prismaClient.user.update({
      where: { id: user.id },
      data: { token: token },
    });

    return token;
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

  static async createAdminGoogle(): Promise<string> {
    const password = await bcrypt.hash("test", 10);
    const user = await prismaClient.user.create({
      data: {
        google_id: "123123123",
        email: "test@gmail.com",
        username: "test",
        password: password,
        name: "test",
        token: "test_token",
        is_verified: true,
        verify_token: null,
        role: UserRole.ADMIN,
      },
    });

    const payload = {
      id: user.id,
      username: user.username,
      role: UserRole.ADMIN,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const token = await sign(
      payload,
      process.env.JWT_SECRET || "secret",
      "HS256",
    );

    await prismaClient.user.update({
      where: { id: user.id },
      data: { token: token },
    });

    return token;
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

  static async ban() {
    await prismaClient.user.update({
      where: {
        username: "test",
      },
      data: {
        is_active: false,
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
        service_id: {
          contains: "SRV",
        },
      },
    });
  }

  static async create() {
    const technician = await TechnicianTest.create();
    return await prismaClient.service.create({
      data: {
        service_id: "SRV-123",
        brand: "OTHER",
        model: "test",
        customer_name: "test",
        phone_number: "08123123123",
        description: "test",
        technician_note: "test",
        status: "PENDING",
        service_list: {
          create: [
            {
              name: "test",
              price: 1000,
            },
          ],
        },
        technician: {
          connect: {
            id: technician.id,
          },
        },
        discount: 0,
        total_price: 1000,
        tracking_token: "test_token",
      },
    });
  }
}

export class ServiceLogTest {
  static async delete() {
    await prismaClient.serviceLog.deleteMany({
      where: {},
    });
  }

  static async create() {
    await prismaClient.serviceLog.create({
      data: {
        user_id: 1,
        action: "CREATED",
        description: "test",
        service_id: 1,
      },
    });
  }
}

export class ProductTest {
  static async delete() {
    await prismaClient.product.deleteMany({
      where: {
        name: {
          contains: "test",
        },
      },
    });
  }

  static async create() {
    return await prismaClient.product.create({
      data: {
        name: "test",
        brand: "OTHER",
        manufacturer: "ORIGINAL",
        category: "OTHER",
        price: 10000,
        cost_price: 8000,
        stock: 10,
      },
    });
  }
}

export class TechnicianTest {
  static async delete() {
    await prismaClient.technician.deleteMany({
      where: {},
    });
  }

  static async create() {
    return await prismaClient.technician.create({
      data: {
        name: "test",
        signature_url: "test.jpg",
        is_active: true,
      },
    });
  }
}

export class TestRequest {
  private static makeHeaders(
    token?: string,
    customHeaders: Record<string, string> = {},
  ): Headers {
    const headers = new Headers(customHeaders);

    if (!headers.has("Content-Type")) {
      headers.append("Content-Type", "application/json");
    }

    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  static async post<T>(
    url: string,
    body: T,
    token?: string,
  ): Promise<Response> {
    return web.request(url, {
      method: "POST",
      headers: this.makeHeaders(token),
      body: JSON.stringify(body),
    });
  }

  static async get(url: string, token?: string): Promise<Response> {
    return web.request(url, {
      method: "GET",
      headers: this.makeHeaders(token),
    });
  }

  static async patch<T>(
    url: string,
    body: T,
    token?: string,
  ): Promise<Response> {
    return web.request(url, {
      method: "PATCH",
      headers: this.makeHeaders(token),
      body: JSON.stringify(body),
    });
  }

  static async delete(url: string, token?: string): Promise<Response> {
    return web.request(url, {
      method: "DELETE",
      headers: this.makeHeaders(token),
    });
  }

  static async patchMultipart(
    url: string,
    formData: FormData,
    token?: string,
  ): Promise<Response> {
    const headers = new Headers();
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    return web.request(url, {
      method: "PATCH",
      headers: headers,
      body: formData,
    });
  }
}
