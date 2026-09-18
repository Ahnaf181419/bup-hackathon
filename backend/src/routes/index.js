import { Router } from "express";
import authRoutes from "./auth.routes.js";
import energyRoutes from "./energy.routes.js";
import scenarioRoutes from "./scenario.routes.js";
import historyRoutes from "./history.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import aiRoutes from "./ai.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/energy", energyRoutes);
router.use("/scenarios", scenarioRoutes);
router.use("/history", historyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);
router.use("/users", userRoutes);

export default router;
