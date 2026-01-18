import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth-middleware";
import type { ApplicationVariables } from "../type/hono-context";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { adminMiddleware } from "../middleware/admin-middleware";
import { ProductController } from "../controller/product-controller";

export const apiRouter = new Hono<{ Variables: ApplicationVariables }>();
apiRouter.use(authMiddleware);

// User API
apiRouter.get("/api/users/current", UserController.get);
apiRouter.patch("/api/users/current", UserController.update);
apiRouter.delete("/api/auth/logout", UserController.logout);

apiRouter.use("/api/services/*", adminMiddleware);
// Service API
apiRouter.post("/api/services", ServiceController.create);
apiRouter.get("/api/services/:id", ServiceController.get);
apiRouter.patch("/api/services/:id", ServiceController.update);
apiRouter.delete("/api/services/:id", ServiceController.remove);
apiRouter.get("/api/services", ServiceController.search);

apiRouter.use("/api/products/*", adminMiddleware);
// Product API
apiRouter.post("/api/products", ProductController.create);
apiRouter.patch("/api/products/:id", ProductController.update);
apiRouter.delete("/api/products/:id", ProductController.remove);
