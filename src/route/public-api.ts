import { Hono } from "hono";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { ProductController } from "../controller/product-controller";

export const publicRouter = new Hono();

// User Public Routes
publicRouter.post("/api/users", (c) => UserController.register(c));
publicRouter.post("/api/auth/login", (c) => UserController.login(c));
publicRouter.post("/api/auth/google", (c) => UserController.loginWithGoogle(c));
publicRouter.get("/api/auth/verify", (c) => UserController.verify(c));
publicRouter.get("/api/auth/resend-verify", (c) =>
  UserController.resendVerification(c),
);

// Repair Public Routes
publicRouter.get(
  "/api/public/services/track/:token",
  ServiceController.getPublic,
);

// Product Public Routes
publicRouter.get("/api/products/:id", ProductController.get);
publicRouter.get("/api/products", ProductController.search);
