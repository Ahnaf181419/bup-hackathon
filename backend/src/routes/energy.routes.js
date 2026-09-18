import { Router } from "express";
import { optimizeEnergyAuth } from "../controllers/energy.controller.js";
import { allowDemoUser } from "../middlewares/auth.js";

const router = Router();

router.post("/optimize", allowDemoUser, optimizeEnergyAuth);

export default router;
