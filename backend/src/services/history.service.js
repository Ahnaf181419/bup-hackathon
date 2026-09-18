import { OptimizationResult } from "../models/OptimizationResult.js";
import { NotFoundError } from "../utils/errors.js";

export async function saveOptimizationResult(userId, result, scenarioInput) {
  try {
    const doc = await OptimizationResult.create({
      userId,
      scenario_id: result.scenario_id,
      directive_interpretation: result.directive_interpretation,
      hourly_plan: result.hourly_plan,
      total_grid_kwh: result.total_grid_kwh,
      total_cost_bdt: result.total_cost_bdt,
      peak_grid_kwh: result.peak_grid_kwh,
      plan_summary: result.plan_summary,
      status: "optimal",
      processingTimeMs: result.processingTimeMs || 0,
      scenario_input: scenarioInput,
      pipeline: result.meta || null,
    });
    return doc;
  } catch (err) {
    return {
      _id: "res-" + Date.now(),
      ...result,
      userId,
      scenario_input: scenarioInput,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getHistoryByUser(userId, { limit = 20, skip = 0, status } = {}) {
  try {
    const query = {
      $or: [{ userId }, { userId: "public-benchmark" }],
    };
    if (status) query.status = status;

    const [results, total] = await Promise.all([
      OptimizationResult.find(query)
        .select("userId scenario_id total_cost_bdt total_grid_kwh peak_grid_kwh status processingTimeMs createdAt plan_summary")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      OptimizationResult.countDocuments(query),
    ]);

    return { results, total };
  } catch (err) {
    return { results: [], total: 0 };
  }
}

export async function getResultById(userId, id) {
  try {
    const doc = await OptimizationResult.findOne({
      $or: [
        { userId, scenario_id: id },
        { userId: "public-benchmark", scenario_id: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });
    if (!doc) throw new NotFoundError(`Result '${id}' not found`);
    return doc;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new NotFoundError(`Result '${id}' not found`);
  }
}
