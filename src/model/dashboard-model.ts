export type DashboardStatsResponse = {
  cards: {
    total_revenue: number;
    revenue_growth: number;
    active_services: number;
    pending_queue: number;
    finished_jobs: number;
  };
  chart_data: {
    name: string;
    total: number;
  }[];
  recent_activity: {
    id: number;
    username: string;
    action: string;
    description: string;
    service_id: string;
    service_pk: number;
    customer_name: string;
    time: string;
    is_deleted: boolean;
  }[];
};

export type DashboardServiceResult = {
  revenue: number;
  revenueGrowth: number;
  activeCount: number;
  pendingCount: number;
  finishedCount: number;
  monthlyRevenue: { name: string; total: number }[];
  logs: {
    id: number;
    user_name: string;
    action: string;
    description: string;
    time: string;
    service_id: string;
    service_pk: number;
    customer_name: string;
    is_deleted: boolean;
  }[];
};

export function toDashboardStatsResponse(
  data: DashboardServiceResult,
): DashboardStatsResponse {
  return {
    cards: {
      total_revenue: data.revenue,
      revenue_growth: data.revenueGrowth,
      active_services: data.activeCount,
      pending_queue: data.pendingCount,
      finished_jobs: data.finishedCount,
    },
    chart_data: data.monthlyRevenue,
    recent_activity: data.logs.map((log) => ({
      id: log.id,
      username: log.user_name,
      action: log.action,
      description: log.description,
      amount: 0,
      time: log.time,
      service_id: log.service_id,
      service_pk: log.service_pk,
      customer_name: log.customer_name,
      is_deleted: log.is_deleted,
    })),
  };
}
