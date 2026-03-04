import type { ContactUsRequest } from "../model/mail-model";
import { formatPhoneNumber } from "../utils/format-phone-number";
import { Mail } from "../utils/mail";

export class ContactService {
  static async sendContactUsMail(request: ContactUsRequest): Promise<Boolean> {
    await Mail.sendContactUsMail({
      ...request,
      phone_number: formatPhoneNumber(request.phone_number || "-"),
    });

    return true;
  }
}
