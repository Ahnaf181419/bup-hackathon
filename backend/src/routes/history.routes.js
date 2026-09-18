import { Router } from "express";
import { listHistory, getHistoryDetail } from "../controllers/history.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listHistory);
router.get("/:id", getHistoryDetail);

export default router;
