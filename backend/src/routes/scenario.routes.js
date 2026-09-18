import { Router } from "express";
import {
  createScenario,
  listScenarios,
  getScenario,
  deleteScenario,
  getBenchmarkMeta,
} from "../controllers/scenario.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/meta/benchmark", getBenchmarkMeta);
router.post("/", createScenario);
router.get("/", listScenarios);
router.get("/:id", getScenario);
router.delete("/:id", deleteScenario);

export default router;
