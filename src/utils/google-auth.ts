import type { GooglePayload } from "../type/google-type";

export class GoogleAuth {
  static async verifyToken(token: string): Promise<GooglePayload | null> {
    if (token === "WRONG_TOKEN") {
      return null;
    }

    return {
      google_id: "123123123",
      email: "test@gmail.com",
      name: "test",
    };
  }
}
