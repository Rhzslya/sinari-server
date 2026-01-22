import { OAuth2Client } from "google-auth-library";
import type { GooglePayload } from "../type/google-type";

export class GoogleAuth {
  private static client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  // static async verifyToken(accessToken: string): Promise<GooglePayload | null> {
  //   try {
  //     const response = await fetch(
  //       "https://www.googleapis.com/oauth2/v3/userinfo",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       },
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch user info from Google");
  //     }

  //     const payload = await response.json();

  //     return {
  //       email: payload.email,
  //       name: payload.name,
  //       google_id: payload.sub,
  //     };
  //   } catch (error) {
  //     throw new Error("Failed to verify Google token");
  //   }
  // }

  static async verifyToken(code: string): Promise<GooglePayload | null> {
    try {
      const { tokens } = await this.client.getToken(code);

      this.client.setCredentials(tokens);

      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) return null;

      return {
        email: payload.email!,
        name: payload.name || payload.email!.split("@")[0],
        google_id: payload.sub,
      };
    } catch (error) {
      console.error("Google Code Exchange Failed:", error);
      return null;
    }
  }
}
