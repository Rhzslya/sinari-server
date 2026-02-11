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
  is_active: boolean;
};

export type DetailedUserResponse = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  google_id: string | null;

  created_at: string;
  updated_at: string;

  verify_expires_at: string | null;
  resend_count: number;
  last_resend_time: string | null;

  password_reset_expires_at: string | null;
  pass_reset_count: number;
  pass_reset_last_time: string | null;
  is_online?: boolean;
  is_active: boolean;
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
    is_active: user.is_active,
  };
}

export function toDetailedUserResponse(user: User): DetailedUserResponse {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    is_verified: user.is_verified,
    google_id: user.google_id,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    verify_expires_at: user.verify_expires_at?.toISOString() || null,
    resend_count: user.resend_count,
    last_resend_time: user.last_resend_time?.toISOString() || null,
    password_reset_expires_at:
      user.password_reset_expires_at?.toISOString() || null,
    pass_reset_count: user.pass_reset_count,
    pass_reset_last_time: user.pass_reset_last_time?.toISOString() || null,
    is_active: user.is_active,
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
