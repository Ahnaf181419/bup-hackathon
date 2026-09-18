import * as scenarioService from "../services/scenario.service.js";

export async function createScenario(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    const scenario = await scenarioService.saveScenario(userId, req.body);
    return res.status(201).json({ scenario });
  } catch (err) {
    next(err);
  }
}

export async function listScenarios(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    const scenarios = await scenarioService.getScenariosByUser(userId);
    return res.status(200).json({ scenarios });
  } catch (err) {
    next(err);
  }
}

export async function getScenario(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    const scenario = await scenarioService.getScenarioById(userId, req.params.id);
    return res.status(200).json({ scenario });
  } catch (err) {
    next(err);
  }
}

export async function deleteScenario(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    await scenarioService.deleteScenario(userId, req.params.id);
    return res.status(200).json({ message: "Scenario deleted" });
  } catch (err) {
    next(err);
  }
}
