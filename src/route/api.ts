import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth-middleware";
import type { ApplicationVariables } from "../type/hono-context";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { adminMiddleware } from "../middleware/admin-middleware";
import { ProductController } from "../controller/product-controller";
import { TechnicianController } from "../controller/technician-controller";
import { ownerMiddleware } from "../middleware/owner-middleware";
import { ServiceLogController } from "../controller/repair-logs-controller";
import { DashboardController } from "../controller/dashboard-controller";
import { ProductLogController } from "../controller/product-logs-controller";
import {
  readLimiterMiddleware,
  writeLimiterMiddleware,
} from "../middleware/rate-limiter";
import { StoreSettingController } from "../controller/store-setting-controller";
import { WhatsappController } from "../controller/whatsapp-controller";

export const apiRouter = new Hono<{ Variables: ApplicationVariables }>();

// 1. Global Auth
apiRouter.use(authMiddleware);

// ================= USER API =================
apiRouter.get("/api/users/current", UserController.get);
apiRouter.patch(
  "/api/users/current",
  writeLimiterMiddleware,
  UserController.update,
);
apiRouter.delete("/api/users/logout", UserController.logout);

// Admin & Owner Routes
apiRouter.get(
  "/api/users",
  adminMiddleware,
  readLimiterMiddleware,
  UserController.search,
);
apiRouter.patch(
  "/api/users/:id",
  ownerMiddleware,
  writeLimiterMiddleware,
  UserController.updateRole,
);
apiRouter.get("/api/users/:id", adminMiddleware, UserController.getById);

//  Write Limiter
apiRouter.delete(
  "/api/users/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  UserController.removeUser,
);

apiRouter.patch(
  "/api/users/:id/restore",
  ownerMiddleware,
  writeLimiterMiddleware,
  UserController.restore,
);

// ================= SERVICE API =================
apiRouter.get(
  "/api/services",
  adminMiddleware,
  readLimiterMiddleware,
  ServiceController.search,
);

apiRouter.post(
  "/api/services",
  adminMiddleware,
  writeLimiterMiddleware,
  ServiceController.create,
);

// Route Service Logs
apiRouter.get(
  "/api/services/:id/logs",
  ownerMiddleware,
  ServiceLogController.get,
);
apiRouter.get(
  "/api/products/:id/logs",
  ownerMiddleware,
  ProductLogController.get,
);

// RESTORE
apiRouter.patch(
  "/api/services/:id/restore",
  ownerMiddleware,
  writeLimiterMiddleware,
  ServiceController.restore,
);

// CRUD Standard (Admin)
apiRouter.get("/api/services/:id", adminMiddleware, ServiceController.get);

apiRouter.patch(
  "/api/services/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  ServiceController.update,
);

//  Write Limiter
apiRouter.delete(
  "/api/services/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  ServiceController.remove,
);

// ================= PRODUCT API =================

apiRouter.get(
  "/api/products",
  adminMiddleware,
  readLimiterMiddleware,
  ProductController.search,
);

apiRouter.post(
  "/api/products",
  adminMiddleware,
  writeLimiterMiddleware,
  ProductController.create,
);

apiRouter.patch(
  "/api/products/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  ProductController.update,
);

apiRouter.patch(
  "/api/products/:id/stock",
  adminMiddleware,
  writeLimiterMiddleware,
  ProductController.updateStock,
);

apiRouter.get("/api/products/:id", adminMiddleware, ProductController.get);

//  Write Limiter
apiRouter.delete(
  "/api/products/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  ProductController.remove,
);

//  Write Limiter
apiRouter.patch(
  "/api/product-logs/:id/void",
  ownerMiddleware,
  writeLimiterMiddleware,
  ProductLogController.voidLog,
);

//  Write Limiter
apiRouter.patch(
  "/api/products/:id/restore",
  ownerMiddleware,
  writeLimiterMiddleware,
  ProductController.restore,
);

// ================= TECHNICIAN API =================

apiRouter.post(
  "/api/technicians",
  adminMiddleware,
  writeLimiterMiddleware,
  TechnicianController.create,
);

apiRouter.get(
  "/api/technicians/active",
  adminMiddleware,
  TechnicianController.listActive,
);

// Search & Detail
apiRouter.get(
  "/api/technicians",
  adminMiddleware,
  readLimiterMiddleware,
  TechnicianController.search,
);
apiRouter.get(
  "/api/technicians/:id",
  adminMiddleware,
  TechnicianController.get,
);

// Update & Delete
apiRouter.patch(
  "/api/technicians/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  TechnicianController.update,
);

// Write Limiter
apiRouter.delete(
  "/api/technicians/:id",
  adminMiddleware,
  writeLimiterMiddleware,
  TechnicianController.remove,
);

apiRouter.patch(
  "/api/technicians/:id/restore",
  ownerMiddleware,
  writeLimiterMiddleware,
  TechnicianController.restore,
);

// ================= DASHBOARD API =================
apiRouter.get(
  "/api/dashboard/stats",
  adminMiddleware,
  readLimiterMiddleware,
  DashboardController.get,
);

// ================= STORE SETTING API =================
apiRouter.patch(
  "/api/store-setting",
  ownerMiddleware,
  writeLimiterMiddleware,
  StoreSettingController.update,
);

apiRouter.get(
  "/api/store-setting",
  adminMiddleware,
  readLimiterMiddleware,
  StoreSettingController.get,
);

// ================= WHATSAPP API =================
apiRouter.get(
  "/api/whatsapp/status",
  adminMiddleware,
  readLimiterMiddleware,
  WhatsappController.getStatus,
);
apiRouter.post(
  "/api/whatsapp/disconnect",
  adminMiddleware,
  writeLimiterMiddleware,
  WhatsappController.disconnect,
);
