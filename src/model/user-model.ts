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
};

export function toUserResponse(user: User): UserResponse {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function toUserResponseWithToken(user: User): UserResponse {
  return {
    ...toUserResponse(user),
    google_id: user.google_id,
    token: user.token,
  };
}
