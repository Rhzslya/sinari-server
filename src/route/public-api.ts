import { Hono } from "hono";
import { UserController } from "../controller/user-controller";

export const publicRouter = new Hono();

publicRouter.post("/api/users", (c) => UserController.register(c));
publicRouter.post("/api/auth/login", (c) => UserController.login(c));
publicRouter.post("/api/auth/google", (c) => UserController.loginWithGoogle(c));
publicRouter.get("/api/auth/verify", (c) => UserController.verify(c));
