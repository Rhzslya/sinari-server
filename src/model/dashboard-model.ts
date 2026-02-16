export type DashboardStatsResponse = {
  cards: {
    total_revenue: number;
    revenue_growth: number;
    profit: number;
    profit_growth: number;
    active_services: number;
    pending_queue: number;
    finished_jobs: number;
    products_sold: number;
  };
  chart_data: {
    name: string;
    total: number;
  }[];
  recent_activity: {
    id: number;
    type: "SERVICE" | "PRODUCT";
    username: string;
    action: string;
    description: string;
    service_id?: string;
    service_pk?: number;
    customer_name?: string;
    product_pk?: number;
    product_name?: string;
    time: string;
    is_deleted: boolean;
  }[];
};

export type DashboardServiceResult = {
  revenue: number;
  revenueGrowth: number;
  profit: number;
  profitGrowth: number;
  activeCount: number;
  pendingCount: number;
  finishedCount: number;
  productsSold: number;
  monthlyRevenue: { name: string; total: number }[];
  logs: DashboardStatsResponse["recent_activity"];
};

export function toDashboardStatsResponse(
  data: DashboardServiceResult,
): DashboardStatsResponse {
  return {
    cards: {
      total_revenue: data.revenue,
      revenue_growth: data.revenueGrowth,
      profit: data.profit,
      profit_growth: data.profitGrowth,
      active_services: data.activeCount,
      pending_queue: data.pendingCount,
      finished_jobs: data.finishedCount,
      products_sold: data.productsSold,
    },
    chart_data: data.monthlyRevenue,
    recent_activity: data.logs.map((log) => ({
      id: log.id,
      type: log.type,
      username: log.username,
      action: log.action,
      description: log.description,
      time: log.time,
      is_deleted: log.is_deleted,
      service_id: log.service_id,
      service_pk: log.service_pk,
      customer_name: log.customer_name,
      product_pk: log.product_pk,
      product_name: log.product_name,
    })),
  };
}
