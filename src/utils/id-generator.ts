import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export function generateServiceId(): string {
  const date = new Date();
  return `SRV-${nanoid()}`;
}
