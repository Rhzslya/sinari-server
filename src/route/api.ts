import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth-middleware";
import type { ApplicationVariables } from "../type/hono-context";
import { UserController } from "../controller/user-controller";

export const apiRouter = new Hono<{ Variables: ApplicationVariables }>();
apiRouter.use(authMiddleware);

// User API
apiRouter.get("/api/users/current", UserController.get);
apiRouter.patch("/api/users/current", UserController.update);
apiRouter.delete("/api/auth/logout", UserController.logout);
