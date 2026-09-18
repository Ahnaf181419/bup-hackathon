import { Router } from "express";
import energyRoutes from "./energy.routes.js";
import scenarioRoutes from "./scenario.routes.js";
import historyRoutes from "./history.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/energy", energyRoutes);
router.use("/scenarios", scenarioRoutes);
router.use("/history", historyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);

export default router;
