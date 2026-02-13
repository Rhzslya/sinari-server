import {
  ServiceStatus,
  UserRole,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import {
  toDashboardStatsResponse,
  type DashboardStatsResponse,
} from "../model/dashboard-model";

export class DashboardService {
  static async getStats(user: User): Promise<DashboardStatsResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const now = new Date();

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [
      currentRevenue,
      lastRevenue,
      activeService,
      pendingQueue,
      finishedJobs,
      monthlyDataRaw,
      recentLogs,
    ] = await Promise.all([
      prismaClient.service.aggregate({
        _sum: { total_price: true },
        where: {
          status: { in: [ServiceStatus.FINISHED, ServiceStatus.TAKEN] },
          updated_at: { gte: startOfCurrentMonth },
        },
      }),

      prismaClient.service.aggregate({
        _sum: { total_price: true },
        where: {
          status: { in: [ServiceStatus.FINISHED, ServiceStatus.TAKEN] },
          updated_at: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      prismaClient.service.count({
        where: { status: ServiceStatus.PROCESS },
      }),

      prismaClient.service.count({
        where: { status: ServiceStatus.PENDING },
      }),

      prismaClient.service.count({
        where: {
          status: { in: [ServiceStatus.FINISHED, ServiceStatus.TAKEN] },
        },
      }),

      prismaClient.service.findMany({
        where: {
          status: { in: [ServiceStatus.FINISHED, ServiceStatus.TAKEN] },
          created_at: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          created_at: true,
          total_price: true,
        },
      }),

      prismaClient.serviceLog.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          user: { select: { username: true, role: true } },
          service: {
            select: {
              id: true,
              service_id: true,
              customer_name: true,
              deleted_at: true,
            },
          },
        },
      }),
    ]);

    const chartMap = new Array(12).fill(0);

    monthlyDataRaw.forEach((item) => {
      const monthIndex = new Date(item.created_at).getMonth();
      chartMap[monthIndex] += item.total_price;
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const chartData = monthNames.map((name, index) => ({
      name,
      total: chartMap[index],
    }));

    const formattedLogs = recentLogs.map((log) => ({
      id: log.id,
      user_name: log.user.username,
      action: log.action,
      description: log.description,
      time: log.created_at.toISOString(),
      service_id: log.service.service_id,
      service_pk: log.service.id,
      customer_name: log.service.customer_name,
      is_deleted: log.service.deleted_at !== null,
    }));

    const currentTotal = currentRevenue._sum.total_price || 0;
    const lastTotal = lastRevenue._sum.total_price || 0;

    let growthPercentage = 0;

    if (lastTotal === 0) {
      growthPercentage = currentTotal > 0 ? 100 : 0;
    } else {
      growthPercentage = ((currentTotal - lastTotal) / lastTotal) * 100;
    }

    return toDashboardStatsResponse({
      revenue: currentTotal,
      revenueGrowth: growthPercentage,
      activeCount: activeService,
      pendingCount: pendingQueue,
      finishedCount: finishedJobs,
      monthlyRevenue: chartData,
      logs: formattedLogs,
    });
  }
}
