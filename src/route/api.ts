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

export const apiRouter = new Hono<{ Variables: ApplicationVariables }>();

// 1. Global Auth
apiRouter.use(authMiddleware);

// ================= USER API =================
apiRouter.get("/api/users/current", UserController.get);
apiRouter.patch("/api/users/current", UserController.update);
apiRouter.delete("/api/users/logout", UserController.logout);

// Admin & Owner Routes
apiRouter.get("/api/users", adminMiddleware, UserController.search);
apiRouter.patch("/api/users/:id", ownerMiddleware, UserController.updateRole);
apiRouter.get("/api/users/:id", adminMiddleware, UserController.getById);
apiRouter.delete("/api/users/:id", adminMiddleware, UserController.removeUser);

// ================= SERVICE API =================
apiRouter.get("/api/services", adminMiddleware, ServiceController.search);
apiRouter.post("/api/services", adminMiddleware, ServiceController.create);

apiRouter.patch(
  "/api/users/:id/restore",
  ownerMiddleware,
  UserController.restore,
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
  ServiceController.restore,
);

// CRUD Standard (Admin)
apiRouter.get("/api/services/:id", adminMiddleware, ServiceController.get);
apiRouter.patch("/api/services/:id", adminMiddleware, ServiceController.update);
apiRouter.delete(
  "/api/services/:id",
  adminMiddleware,
  ServiceController.remove,
);

// ================= PRODUCT API =================
apiRouter.use("/api/products/*", adminMiddleware);
apiRouter.get("/api/products", adminMiddleware, ProductController.search);
apiRouter.post("/api/products", ProductController.create);
apiRouter.patch("/api/products/:id", ProductController.update);
apiRouter.patch("/api/products/:id/stock", ProductController.updateStock);

apiRouter.get("/api/products/:id", adminMiddleware, ProductController.get);
apiRouter.delete(
  "/api/products/:id",
  adminMiddleware,
  ProductController.remove,
);
apiRouter.patch(
  "/api/product-logs/:id/void",
  ownerMiddleware,
  ProductLogController.voidLog,
);

apiRouter.patch(
  "/api/products/:id/restore",
  ownerMiddleware,
  ProductController.restore,
);

// ================= TECHNICIAN API =================
apiRouter.post(
  "/api/technicians",
  adminMiddleware,
  TechnicianController.create,
);

apiRouter.get("/api/technicians/active", TechnicianController.listActive);

// Search & Detail
apiRouter.get("/api/technicians", TechnicianController.search);
apiRouter.get("/api/technicians/:id", TechnicianController.get);

// Update & Delete
apiRouter.patch(
  "/api/technicians/:id",
  adminMiddleware,
  TechnicianController.update,
);
apiRouter.delete(
  "/api/technicians/:id",
  adminMiddleware,
  TechnicianController.remove,
);

apiRouter.patch(
  "/api/technicians/:id/restore",
  ownerMiddleware,
  TechnicianController.restore,
);

// ================= DASHBOARD API =================
apiRouter.get("/api/dashboard/stats", adminMiddleware, DashboardController.get);
