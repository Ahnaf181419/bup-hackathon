import * as scenarioService from "../services/scenario.service.js";
import { OPERATOR_ID } from "../config/operator.js";

export async function createScenario(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const scenario = await scenarioService.saveScenario(userId, req.body);
    return res.status(201).json({ scenario });
  } catch (err) {
    next(err);
  }
}

export async function listScenarios(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const scenarios = await scenarioService.getScenariosByUser(userId);
    return res.status(200).json({ scenarios });
  } catch (err) {
    next(err);
  }
}

export async function getScenario(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const scenario = await scenarioService.getScenarioById(userId, req.params.id);
    return res.status(200).json({ scenario });
  } catch (err) {
    next(err);
  }
}

export async function deleteScenario(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    await scenarioService.deleteScenario(userId, req.params.id);
    return res.status(200).json({ message: "Scenario deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getBenchmarkMeta(req, res, next) {
  try {
    const meta = await scenarioService.getBenchmarkMeta();
    return res.status(200).json({ meta });
  } catch (err) {
    next(err);
  }
}

