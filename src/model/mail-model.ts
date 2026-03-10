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

export type VerificationMailRequest = {
  email: string;
  name: string;
  token: string;
};

export type PasswordResetMailRequest = {
  email: string;
  name: string;
  token: string;
};

export type UserNotificationRequest = {
  email: string;
  name: string;
};
