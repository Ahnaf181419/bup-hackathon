import { Router } from "express";
import { generate } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/generate", requireAuth, generate);

export default router;
