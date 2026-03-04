import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { ContactTest, TestRequest } from "./test-utils";
import { logger } from "../application/logging";
import { Mail } from "../utils/mail";

describe("Contact API", () => {
  afterEach(() => {
    spyOn(Mail, "sendContactUsMail").mockRestore();
  });

  describe("POST /api/public/contact-us", () => {
    it("should send contact email successfully with valid data", async () => {
      const mailSpy = spyOn(Mail, "sendContactUsMail").mockResolvedValue(
        undefined,
      );

      const payload = ContactTest.getValidPayload();
      const response = await TestRequest.post(
        "/api/public/contact-us",
        payload,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(200);
      expect(body.data.message).toBe("Mail sent successfully");
      expect(mailSpy).toHaveBeenCalledTimes(1);
    }, 15000);

    it("should reject and return 400 if validation fails (Zod)", async () => {
      const invalidPayload = {
        name: "Bu",
        email: "not-an-email",
        subject: "Halo",
        message: "Pendek",
      };

      const response = await TestRequest.post(
        "/api/public/contact-us",
        invalidPayload,
      );
      const body = await response.json();

      logger.debug(body);

      expect(response.status).toBe(400);
      expect(body.errors).toBeDefined();
    }, 15000);
  });
});
