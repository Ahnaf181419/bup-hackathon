import { Router } from "express";
import { generate, getHistory, clearHistory } from "../controllers/ai.controller.js";

const router = Router();

router.get("/history", getHistory);
router.post("/generate", generate);
router.delete("/history", clearHistory);

export default router;
