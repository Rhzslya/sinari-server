import type { User, UserRole } from "../../generated/prisma/client";

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  token?: string | null;
  google_id?: string | null;
};

export type NotPublicUserResponse = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  google_id?: string | null;
  is_online?: boolean;
  created_at: Date;
  updated_at?: Date;
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

export type UpdateRoleRequest = {
  id: number;
  role: UserRole;
};

export type SearchUserRequest = {
  username?: string;
  name?: string;
  page: number;
  size: number;
  sort_by?: "created_at" | "name";
  sort_order?: "asc" | "desc";
  is_online?: boolean;
  role?: UserRole;
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
    id: user.id,
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

export function toNotPublicUserResponse(user: User): NotPublicUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    google_id: user.google_id,
    created_at: user.created_at,
    updated_at: user.updated_at,
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
