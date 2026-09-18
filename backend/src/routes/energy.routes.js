import { Router } from "express";
import { optimizeEnergyDashboard } from "../controllers/energy.controller.js";

const router = Router();

router.post("/optimize", optimizeEnergyDashboard);

export default router;
