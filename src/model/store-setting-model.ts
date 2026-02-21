export type StoreSettingResponse = {
  id: number;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string | null;
  store_website: string | null;
  warranty_text: string;
  payment_info: string;
};

export type UpdateStoreSettingRequest = {
  id: number;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_website?: string;
  warranty_text?: string;
  payment_info?: string;
};

export type CheckStoreSettingExistRequest = {
  id: number;
};

export type GetDetailedStoreSettingRequest = {
  id: number;
};

export function toStoreSettingResponse(
  setting: StoreSettingResponse,
): StoreSettingResponse {
  return {
    id: setting.id,
    store_name: setting.store_name,
    store_address: setting.store_address,
    store_phone: setting.store_phone,
    store_email: setting.store_email,
    store_website: setting.store_website,
    warranty_text: setting.warranty_text,
    payment_info: setting.payment_info,
  };
}
