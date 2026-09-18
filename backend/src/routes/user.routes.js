import { Router } from "express";
import { getMe } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/me", requireAuth, getMe);

export default router;
