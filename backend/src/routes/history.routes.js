import { Router } from "express";
import { listHistory, getHistoryDetail } from "../controllers/history.controller.js";

const router = Router();


router.get("/", listHistory);
router.get("/:id", getHistoryDetail);

export default router;
