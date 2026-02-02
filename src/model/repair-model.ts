import type {
  Brand,
  Service,
  ServiceItem,
  ServiceStatus,
} from "../../generated/prisma/client";

export type ServiceResponse = {
  id: number;
  brand: Brand;
  model: string;
  customer_name: string;
  phone_number: string;
  description?: string | null;
  technician_note?: string | null;
  status: ServiceStatus;
  service_list: {
    id: number;
    name: string;
    price: number;
  }[];
  total_items: number;
  discount?: number;
  total_price: number;
  created_at: Date;
  updated_at?: Date;
  tracking_token: string;
  service_id: string;
};

export type PublicServiceResponse = {
  brand: Brand;
  model: string;
  customer_name: string;
  status: ServiceStatus;
  phone_number: string;
  description?: string | null;
  technician_note?: string | null;
  service_list: {
    id: number;
    name: string;
    price: number;
  }[];
  total_items: number;
  discount?: number;
  total_price: number;
  created_at: Date;
  updated_at?: Date;
};

export type CreateServiceRequest = {
  brand: Brand;
  model: string;
  customer_name: string;
  phone_number: string;
  description?: string;
  technician_note?: string;
  service_list: CreateServiceItemRequest[];
  discount?: number;
};

export type CreateServiceItemRequest = {
  name: string;
  price: number;
};

export type UpdateServiceItemRequest = {
  name: string;
  price: number;
};

export type UpdateServiceRequest = {
  id: number;
  status?: ServiceStatus;
  technician_note?: string;
  discount?: number;
  brand?: Brand;
  model?: string;
  customer_name?: string;
  phone_number?: string;
  description?: string;
  service_list?: UpdateServiceItemRequest[];
};

export type SearchServiceRequest = {
  service_id?: string;
  brand?: Brand;
  model?: string;
  customer_name?: string;
  status?: ServiceStatus;
  page: number;
  size: number;
  min_price?: number;
  max_price?: number;
  sort_by?: "total_price" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
};

export function toServiceResponse(
  service: Service & { service_list: ServiceItem[] },
): ServiceResponse {
  return {
    id: service.id,
    service_id: service.service_id,
    brand: service.brand,
    model: service.model,
    customer_name: service.customer_name,
    phone_number: maskPhoneNumber(service.phone_number),
    description: service.description,
    technician_note: service.technician_note,
    status: service.status,
    service_list: service.service_list.map((item) => {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
      };
    }),
    total_items: service.service_list.length,
    discount: service.discount,
    total_price: service.total_price,
    created_at: service.created_at,
    updated_at: service.updated_at,
    tracking_token: service.tracking_token,
  };
}

export function toPublicServiceResponse(
  service: Service & { service_list: ServiceItem[] },
): PublicServiceResponse {
  return {
    brand: service.brand,
    model: service.model,
    customer_name: service.customer_name,
    phone_number: maskPhoneNumber(service.phone_number),
    description: service.description,
    technician_note: service.technician_note,
    status: service.status,
    service_list: service.service_list.map((item) => {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
      };
    }),
    total_items: service.service_list?.length || 0,
    discount: service.discount,
    total_price: service.total_price,
    created_at: service.created_at,
    updated_at: service.updated_at,
  };
}

export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 8) return phoneNumber;
  const visibleStart = 4;
  const visibleEnd = 4;
  return (
    phoneNumber.substring(0, visibleStart) +
    "*".repeat(phoneNumber.length - visibleStart - visibleEnd) +
    phoneNumber.substring(phoneNumber.length - visibleEnd)
  );
}
