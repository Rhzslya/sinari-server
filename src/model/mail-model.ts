export type ContactUsResponse = {
  message: string;
};

export type ContactUsRequest = {
  name: string;
  email: string;
  phone_number: string;
  subject: string;
  message: string;
};

export function toContactUsResponse(
  data: ContactUsResponse,
): ContactUsResponse {
  return data;
}
