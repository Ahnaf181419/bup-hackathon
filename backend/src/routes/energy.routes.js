import { Router } from "express";
import { optimizeEnergyAuth } from "../controllers/energy.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/optimize", requireAuth, optimizeEnergyAuth);

export default router;
