import { Router } from "express";
import {
  createScenario,
  listScenarios,
  getScenario,
  deleteScenario,
} from "../controllers/scenario.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createScenario);
router.get("/", listScenarios);
router.get("/:id", getScenario);
router.delete("/:id", deleteScenario);

export default router;
