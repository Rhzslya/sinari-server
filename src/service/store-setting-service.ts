import { UserRole, type User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { DEFAULT_STORE_SETTING } from "../config/store-setting";
import { ResponseError } from "../error/response-error";
import {
  toStoreSettingResponse,
  type CheckStoreSettingExistRequest,
  type GetDetailedStoreSettingRequest,
  type StoreSettingResponse,
  type UpdateStoreSettingRequest,
} from "../model/store-setting-model";
import { StoreSettingValidation } from "../validation/store-setting-validation";
import { Validation } from "../validation/validation";

export class StoreSettingService {
  static async checkStoreSettingExist(
    request: CheckStoreSettingExistRequest,
  ): Promise<StoreSettingResponse> {
    const setting = await prismaClient.storeSetting.findUnique({
      where: {
        id: request.id,
      },
    });

    if (!setting) {
      throw new ResponseError(404, "Store Setting not found");
    }

    return setting;
  }

  static async update(
    user: User,
    request: UpdateStoreSettingRequest,
  ): Promise<StoreSettingResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(
      StoreSettingValidation.UPDATE,
      request,
    );

    const setting = await prismaClient.storeSetting.upsert({
      where: { id: 1 },
      update: {
        store_name: updateRequest.store_name,
        store_address: updateRequest.store_address,
        store_phone: updateRequest.store_phone,
        store_email: updateRequest.store_email,
        store_website: updateRequest.store_website,
        warranty_text: updateRequest.warranty_text,
        payment_info: updateRequest.payment_info,
      },
      create: {
        store_name:
          updateRequest.store_name || DEFAULT_STORE_SETTING.STORE_NAME,
        store_address:
          updateRequest.store_address || DEFAULT_STORE_SETTING.STORE_ADDRESS,
        store_phone:
          updateRequest.store_phone || DEFAULT_STORE_SETTING.STORE_PHONE,
        store_email:
          updateRequest.store_email || DEFAULT_STORE_SETTING.STORE_EMAIL,
        store_website:
          updateRequest.store_website || DEFAULT_STORE_SETTING.STORE_WEBSITE,
        warranty_text:
          updateRequest.warranty_text || DEFAULT_STORE_SETTING.WARRANTY_TEXT,
        payment_info:
          updateRequest.payment_info || DEFAULT_STORE_SETTING.PAYMENT_INFO,
      },
    });

    return toStoreSettingResponse(setting);
  }

  static async get(
    user: User,
    request: GetDetailedStoreSettingRequest,
  ): Promise<StoreSettingResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const setting = await prismaClient.storeSetting.findUnique({
      where: { id: request.id },
    });
    if (!setting) {
      return {
        id: 1,
        store_name: DEFAULT_STORE_SETTING.STORE_NAME,
        store_address: DEFAULT_STORE_SETTING.STORE_ADDRESS,
        store_phone: DEFAULT_STORE_SETTING.STORE_PHONE,
        store_email: DEFAULT_STORE_SETTING.STORE_EMAIL,
        store_website: DEFAULT_STORE_SETTING.STORE_WEBSITE,
        warranty_text: DEFAULT_STORE_SETTING.WARRANTY_TEXT,
        payment_info: DEFAULT_STORE_SETTING.PAYMENT_INFO,
        updated_at: new Date().toISOString(),
      } as StoreSettingResponse;
    }

    return toStoreSettingResponse(setting);
  }
}
