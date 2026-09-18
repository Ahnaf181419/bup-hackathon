import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aiRoutes from "./ai.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/users", userRoutes);

export default router;
