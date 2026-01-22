import type { User } from "../../generated/prisma/client";

export type UserResponse = {
  username: string;
  email: string;
  name: string;
  role: string;
  token?: string | null;
  google_id?: string | null;
};

export type CreateUserRequest = {
  email: string;
  username: string;
  name: string;
  password: string;
};

export type LoginUserRequest = {
  email?: string;
  username?: string;
  password: string;
};

export type CreateUserWithGoogleRequest = {
  email: string;
  username: string;
  name: string;
  google_id: string;
  token: string;
};

export type UpdateUserRequest = {
  email?: string;
  name?: string;
  password?: string;
  current_password?: string;
};

export type EmailVerificationResponse = {
  email: string;
  message: string;
};

export type ForgotPasswordRequest = {
  identifier: string;
};

export type ForgotPasswordResponse = {
  email: string;
  message: string;
};

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
  confirm_new_password: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export function toUserResponse(user: User): UserResponse {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    token: user.token,
  };
}

export function toUserResponseWithToken(user: User): UserResponse {
  return {
    ...toUserResponse(user),
    google_id: user.google_id,
  };
}

export function toEmailVerificationResponse(
  email: string,
): EmailVerificationResponse {
  return {
    email: maskEmail(email),
    message: "Verification email has been sent successfully",
  };
}

export function toForgotPasswordResponse(
  email: string,
): EmailVerificationResponse {
  return {
    email: maskEmail(email),
    message: "Forgot password Request has been sent successfully",
  };
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;

  const [localPart, domain] = email.split("@");

  if (localPart.length <= 2) {
    return `${localPart}*****@${domain}`;
  }

  const maskedLocal = localPart.substring(0, 3) + "*".repeat(5);

  return `${maskedLocal}@${domain}`;
}
