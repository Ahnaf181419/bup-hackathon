import { Router } from "express";
import { generate, getHistory, clearHistory } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/history", requireAuth, getHistory);
router.post("/generate", requireAuth, generate);
router.delete("/history", requireAuth, clearHistory);

export default router;
