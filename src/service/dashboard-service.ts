import {
  ProductLogAction,
  ServiceStatus,
  UserRole,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { redis } from "../lib/redis";
import {
  toDashboardStatsResponse,
  type DashboardStatsResponse,
} from "../model/dashboard-model";

export class DashboardService {
  static async getStats(user: User): Promise<DashboardStatsResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const CACHE_KEY = "dashboard:stats:global";

    const cachedData = await redis.get<DashboardStatsResponse>(CACHE_KEY);

    if (cachedData) {
      return typeof cachedData === "string"
        ? JSON.parse(cachedData)
        : cachedData;
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
      // DATA SERVICE
      currentServiceRevenue,
      lastServiceRevenue,
      activeService,
      pendingQueue,
      finishedJobs,

      monthlyServiceDataRaw,
      recentServiceLogs,

      // DATA PRODUCT
      currentProductRevenue,
      lastProductRevenue,
      monthlyProductDataRaw,
      recentProductLogs,
      productsSoldRaw,
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

      prismaClient.productLog.aggregate({
        _sum: {
          total_revenue: true,
          total_profit: true,
        },
        where: {
          action: ProductLogAction.SALE_OFFLINE,
          is_voided: false,
          created_at: { gte: startOfCurrentMonth },
        },
      }),

      prismaClient.productLog.aggregate({
        _sum: {
          total_revenue: true,
          total_profit: true,
        },
        where: {
          action: ProductLogAction.SALE_OFFLINE,
          is_voided: false,
          created_at: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prismaClient.productLog.findMany({
        where: {
          action: ProductLogAction.SALE_OFFLINE,
          is_voided: false,
          created_at: { gte: startOfYear, lte: endOfYear },
        },
        select: { created_at: true, total_revenue: true },
      }),

      prismaClient.productLog.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          user: { select: { username: true, role: true } },
          product: { select: { id: true, name: true, deleted_at: true } },
        },
      }),
      prismaClient.productLog.aggregate({
        _sum: { quantity_change: true },
        where: {
          action: ProductLogAction.SALE_OFFLINE,
          is_voided: false,
          created_at: { gte: startOfCurrentMonth },
        },
      }),
    ]);

    const currentRevenueTotal =
      (currentServiceRevenue._sum.total_price || 0) +
      (currentProductRevenue._sum.total_revenue || 0);

    const lastRevenueTotal =
      (lastServiceRevenue._sum.total_price || 0) +
      (lastProductRevenue._sum.total_revenue || 0);

    let revenueGrowth = 0;
    if (lastRevenueTotal === 0) {
      revenueGrowth = currentRevenueTotal > 0 ? 100 : 0;
    } else {
      revenueGrowth =
        ((currentRevenueTotal - lastRevenueTotal) / lastRevenueTotal) * 100;
    }

    const currentProfitTotal =
      (currentServiceRevenue._sum.total_price || 0) +
      (currentProductRevenue._sum.total_profit || 0);

    const lastProfitTotal =
      (lastServiceRevenue._sum.total_price || 0) +
      (lastProductRevenue._sum.total_profit || 0);

    let profitGrowth = 0;
    if (lastProfitTotal === 0) {
      profitGrowth = currentProfitTotal > 0 ? 100 : 0;
    } else {
      profitGrowth =
        ((currentProfitTotal - lastProfitTotal) / lastProfitTotal) * 100;
    }

    const productsSoldCount = Math.abs(
      productsSoldRaw._sum.quantity_change || 0,
    );

    const chartMap = new Array(12).fill(0);

    monthlyServiceDataRaw.forEach((item) => {
      const monthIndex = new Date(item.created_at).getMonth();
      chartMap[monthIndex] += item.total_price;
    });

    monthlyProductDataRaw.forEach((item) => {
      const monthIndex = new Date(item.created_at).getMonth();
      chartMap[monthIndex] += item.total_revenue;
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

    const formattedServiceLogs = recentServiceLogs.map((log) => ({
      id: log.id,
      type: "SERVICE" as const,
      username: log.user.username,
      action: log.action,
      description: log.description,
      time: log.created_at.toISOString(),
      service_id: log.service.service_id,
      service_pk: log.service.id,
      customer_name: log.service.customer_name,
      is_deleted: log.service.deleted_at !== null,
    }));

    const formattedProductLogs = recentProductLogs.map((log) => ({
      id: log.id,
      type: "PRODUCT" as const,
      username: log.user.username,
      action: log.action,
      description: log.description,
      time: log.created_at.toISOString(),
      product_pk: log.product_id,
      product_name: log.product.name,
      is_deleted: log.product.deleted_at !== null,
    }));

    const combinedRecentLogs = [
      ...formattedServiceLogs,
      ...formattedProductLogs,
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    const result = toDashboardStatsResponse({
      revenue: currentRevenueTotal,
      revenueGrowth: revenueGrowth,
      profit: currentProfitTotal,
      profitGrowth: profitGrowth,
      activeCount: activeService,
      pendingCount: pendingQueue,
      finishedCount: finishedJobs,
      productsSold: productsSoldCount,
      monthlyRevenue: chartData,
      logs: combinedRecentLogs,
    });

    await redis.set(CACHE_KEY, JSON.stringify(result), { ex: 300 });

    return result;
  }
}
