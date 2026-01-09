import { prismaClient } from "../application/database";
import { web } from "../application/web";
import bcrypt from "bcrypt";
export class UserTest {
  static async delete() {
    await prismaClient.user.deleteMany({
      where: {
        username: "test",
        email: "test@gmail.com",
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
      },
    });
  }

  static async createGoogleDuplicate() {
    await prismaClient.user.create({
      data: {
        email: "test123@gmail.com",
        username: "test",
        name: "test",
        google_id: "123123123",
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
      headers.append("X-API-TOKEN", token);
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
}
