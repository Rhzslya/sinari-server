import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export function generateServiceId(): string {
  return `SRV-${nanoid()}`;
}

export function generateOtp(): string {
  return nanoid();
}
