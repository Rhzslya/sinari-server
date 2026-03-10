import { Hono } from "hono";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { ProductController } from "../controller/product-controller";
import {
  authLimiterMiddleware,
  readLimiterMiddleware,
  writeLimiterMiddleware,
} from "../middleware/rate-limiter";
import { ContactController } from "../controller/contact-controller";
import { StoreSettingController } from "../controller/store-setting-controller";

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

// Contact Public Routes
publicRouter.post("/api/public/contact-us", writeLimiterMiddleware, (c) =>
  ContactController.sendContactUsMail(c),
);

// Store Setting Public Routes
publicRouter.get("/api/public/store-setting", readLimiterMiddleware, (c) =>
  StoreSettingController.getPublic(c),
);
