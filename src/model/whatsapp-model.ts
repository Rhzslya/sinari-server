// src/model/whatsapp-model.ts

export type WhatsappConnectionStatus =
  | "connected"
  | "loading_qr"
  | "disconnected";

export type WhatsappStatusResponse = {
  status: WhatsappConnectionStatus;
  qr_code?: string | null;
};

export type WhatsappDisconnectResponse = {
  success: boolean;
  message: string;
};

export type WhatsappSendResult = {
  success: boolean;
  error?: string;
};
