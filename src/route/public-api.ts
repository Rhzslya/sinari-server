import { Hono } from "hono";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { ProductController } from "../controller/product-controller";
import {
  authLimiterMiddleware,
  readLimiterMiddleware,
  writeLimiterMiddleware,
} from "../middleware/rate-limiter";

export const publicRouter = new Hono();

// User Public Routes
publicRouter.post("/api/users", authLimiterMiddleware, (c) =>
  UserController.register(c),
);
publicRouter.post("/api/auth/login", authLimiterMiddleware, (c) =>
  UserController.login(c),
);
publicRouter.post("/api/auth/google", (c) => UserController.loginWithGoogle(c));
publicRouter.get("/api/auth/verify", (c) => UserController.verify(c));
publicRouter.get("/api/auth/resend-verify", (c) =>
  UserController.resendVerification(c),
);
publicRouter.post("/api/auth/forgot-password", authLimiterMiddleware, (c) =>
  UserController.forgotPassword(c),
);
publicRouter.patch("/api/auth/reset-password", authLimiterMiddleware, (c) =>
  UserController.resetPassword(c),
);

// Repair Public Routes
publicRouter.get(
  "/api/public/services/track/:identifier",
  readLimiterMiddleware,
  ServiceController.getPublic,
);

// Product Public Routes
publicRouter.get("/api/public/products/:id", ProductController.get);
publicRouter.get(
  "/api/public/products",
  readLimiterMiddleware,
  ProductController.search,
);
