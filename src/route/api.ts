import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth-middleware";
import type { ApplicationVariables } from "../type/hono-context";
import { UserController } from "../controller/user-controller";
import { ServiceController } from "../controller/repair-controller";
import { adminMiddleware } from "../middleware/admin-middleware";
import { ProductController } from "../controller/product-controller";
import { TechnicianController } from "../controller/technician-controller";
import { ownerMiddleware } from "../middleware/owner-middleware";

export const apiRouter = new Hono<{ Variables: ApplicationVariables }>();
apiRouter.use(authMiddleware);

// User API
apiRouter.get("/api/users", adminMiddleware, UserController.search);
apiRouter.get("/api/users/current", UserController.get);
apiRouter.patch("/api/users/current", UserController.update);
apiRouter.delete("/api/users/logout", UserController.logout);

apiRouter.patch("/api/users/:id", ownerMiddleware, UserController.updateRole);

apiRouter.delete("/api/users/:id", adminMiddleware, UserController.removeUser);

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
apiRouter.get("/api/products/:id", ProductController.get);
apiRouter.patch("/api/products/:id", ProductController.update);
apiRouter.delete("/api/products/:id", ProductController.remove);

// Technician API
apiRouter.post("/api/technicians", TechnicianController.create);
apiRouter.get("/api/technicians/active", TechnicianController.listActive);
apiRouter.get("/api/technicians", TechnicianController.search);
apiRouter.patch("/api/technicians/:id", TechnicianController.update);
apiRouter.get("/api/technicians/:id", TechnicianController.get);
apiRouter.delete("/api/technicians/:id", TechnicianController.remove);
