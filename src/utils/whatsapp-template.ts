import { ServiceStatus } from "../../generated/prisma/client";

export class WhatsappTemplate {
  private static readonly BASE_URL = "https://sinari.my.id/services/track";

  private static getReadableStatus(status: ServiceStatus | string): string {
    const statusTranslations: Record<string, string> = {
      PENDING: "Menunggu Antrean",
      PROCESSING: "Sedang Dikerjakan",
      FINISHED: "Selesai Diperbaiki (Bisa Diambil)",
      TAKEN: "Sudah Diambil",
      CANCELLED: "Dibatalkan",
    };
    return statusTranslations[status] || status;
  }

  static generateCreateMessage(service: {
    customer_name: string;
    brand: string;
    model: string;
    tracking_token: string;
  }): string {
    const trackingUrl = `${this.BASE_URL}/${service.tracking_token}`;
    return `Halo *${service.customer_name}*,\n\nTerima kasih telah mempercayakan perbaikan perangkat Anda (*${service.brand} ${service.model}*) di *Sinari Cell*.\n\nServis Anda telah kami catat ke dalam sistem. Untuk memantau rincian biaya dan status perbaikan secara real-time, silakan klik tautan berikut:\n${trackingUrl}\n\nKami akan mengabari Anda jika ada *update* lebih lanjut. Terima kasih!`;
  }

  static generateUpdateMessage(service: {
    customer_name: string;
    brand: string;
    model: string;
    tracking_token: string;
    status: ServiceStatus | string;
  }): string {
    const trackingUrl = `${this.BASE_URL}/${service.tracking_token}`;
    const readableStatus = this.getReadableStatus(service.status);

    return `Halo *${service.customer_name}*,\n\nStatus perbaikan perangkat Anda (*${service.brand} ${service.model}*) saat ini telah diperbarui menjadi: *${readableStatus}*.\n\nUntuk memantau detail dan rincian biaya, silakan klik tautan berikut:\n${trackingUrl}\n\nTerima kasih,\n*Sinari Cell*`;
  }
}
