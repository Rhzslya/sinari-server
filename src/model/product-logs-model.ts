import type { ProductLog, User } from "../../generated/prisma/client";
import type { ProductLogAction, UserRole } from "../../generated/prisma/enums";

export type ProductLogResponse = {
  id: number;
  product_id: number;
  action: ProductLogAction;
  quantity_change: number;
  description: string;
  total_revenue: number;
  total_profit: number;
  created_at: Date;
  is_voided: boolean;
  user: {
    username: string;
    role: UserRole;
  };
};

export type GetLogRequest = {
  id: number;
};

export function toProductLogResponse(
  log: ProductLog & { user: User },
): ProductLogResponse {
  return {
    id: log.id,
    product_id: log.product_id,
    action: log.action,
    quantity_change: log.quantity_change,
    description: log.description,
    total_revenue: log.total_revenue,
    total_profit: log.total_profit,
    created_at: log.created_at,
    is_voided: log.is_voided,
    user: {
      username: log.user.username,
      role: log.user.role,
    },
  };
}
