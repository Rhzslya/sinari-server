import {
  ProductLogAction,
  UserRole,
  type Product,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import {
  toProductLogResponse,
  type GetLogRequest,
  type ProductLogResponse,
} from "../model/product-logs-model";
import { CheckExist } from "../utils/check-exist";

export class ProductLogService {
  static async getLogs(
    user: User,
    productId: number,
  ): Promise<ProductLogResponse[]> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    await CheckExist.checkProductExist(productId);

    const logs = await prismaClient.productLog.findMany({
      where: {
        product_id: productId,
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return logs.map(toProductLogResponse);
  }

  static async voidProductLogs(
    user: User,
    request: GetLogRequest,
  ): Promise<string> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Only OWNER can void logs.");
    }

    const log = await prismaClient.productLog.findUnique({
      where: { id: request.id },
      include: { product: true },
    });

    if (!log) throw new ResponseError(404, "Log not found");
    if (log.is_voided) throw new ResponseError(400, "Log is already voided");

    const validVoidActions: ProductLogAction[] = [
      ProductLogAction.SALE_OFFLINE,
      ProductLogAction.ADJUST_DAMAGE,
      ProductLogAction.ADJUST_LOST,
      ProductLogAction.RESTOCK,
    ];
    if (!validVoidActions.includes(log.action)) {
      throw new ResponseError(400, "This type of action cannot be voided.");
    }

    const reversedQuantity = log.quantity_change * -1;
    const newStock = log.product.stock + reversedQuantity;

    if (newStock < 0) {
      throw new ResponseError(
        400,
        "Cannot void: Reversing this log will cause negative stock.",
      );
    }

    await prismaClient.$transaction([
      prismaClient.productLog.update({
        where: { id: request.id },
        data: { is_voided: true },
      }),
      prismaClient.product.update({
        where: { id: log.product_id },
        data: { stock: newStock },
      }),
      prismaClient.productLog.create({
        data: {
          product_id: log.product_id,
          user_id: user.id,
          action: ProductLogAction.VOID_LOG,
          quantity_change: reversedQuantity,
          description: `Reversed log #${log.id} (${log.action}). Stock adjusted: ${reversedQuantity > 0 ? "+" : ""}${reversedQuantity}`,
        },
      }),
    ]);

    return "Log successfully voided and stock reverted.";
  }
}
