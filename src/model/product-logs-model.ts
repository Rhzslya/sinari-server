import type { ProductLogAction } from "../../generated/prisma/enums";

export type ProductLogResponse = {
  id: number;
  product_id: number;

  action: ProductLogAction;
  quantity_change: number;
  description: string;
  created_at: Date;
  user: {
    name: string;
    role: string;
  };
};
