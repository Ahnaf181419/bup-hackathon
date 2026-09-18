import { runOptimizationPipeline } from "../services/pipeline.service.js";
import { saveOptimizationResult } from "../services/history.service.js";
import { validateOptimizeRequest } from "../validators/energy.validator.js";

function judgeResponse(result) {
  return {
    scenario_id: result.scenario_id,
    directive_interpretation: result.directive_interpretation,
    hourly_plan: result.hourly_plan,
    total_grid_kwh: result.total_grid_kwh,
    total_cost_bdt: result.total_cost_bdt,
    peak_grid_kwh: result.peak_grid_kwh,
    plan_summary: result.plan_summary,
  };
}

/**
 * Public Judge Endpoint: POST /optimize-energy
 * Exact Problem Statement contract. Stateless: no database access on this path.
 */
export async function optimizeEnergyPublic(req, res, next) {
  try {
    const input = validateOptimizeRequest(req.body);
    const result = await runOptimizationPipeline(input);
    return res.status(200).json(judgeResponse(result));
  } catch (err) {
    next(err);
  }
}

/**
 * Dashboard Endpoint: POST /api/energy/optimize
 * Same pipeline, plus persistence and pipeline metadata for the UI.
 */
export async function optimizeEnergyAuth(req, res, next) {
  try {
    const userId = req.user?.id || "operator";
    const input = validateOptimizeRequest(fromCamelCase(req.body));
    const result = await runOptimizationPipeline(input);
    const savedDoc = await saveOptimizationResult(userId, result, input);

    return res.status(200).json({
      success: true,
      _id: savedDoc._id,
      ...judgeResponse(result),
      processingTimeMs: result.processingTimeMs,
      pipeline: result.meta,
      scenario_input: input,
    });
  } catch (err) {
    next(err);
  }
}

// The dashboard historically accepted camelCase keys; map them to the canonical snake_case contract.
function fromCamelCase(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const b = body.battery || {};
  return {
    scenario_id: body.scenario_id ?? body.scenarioId,
    operator_notes: body.operator_notes ?? body.operatorNotes,
    hours: Array.isArray(body.hours)
      ? body.hours.map((h) =>
          h && typeof h === "object"
            ? {
                hour: h.hour,
                demand_kwh: h.demand_kwh ?? h.demandKwh,
                solar_kwh: h.solar_kwh ?? h.solarKwh,
                tariff_bdt_per_kwh: h.tariff_bdt_per_kwh ?? h.tariffBdtPerKwh,
              }
            : h
        )
      : body.hours,
    battery:
      body.battery && typeof body.battery === "object"
        ? {
            capacity_kwh: b.capacity_kwh ?? b.capacityKwh,
            initial_energy_kwh: b.initial_energy_kwh ?? b.initialEnergyKwh,
            minimum_energy_kwh: b.minimum_energy_kwh ?? b.minimumEnergyKwh,
            max_charge_kwh_per_hour: b.max_charge_kwh_per_hour ?? b.maxChargeKwhPerHour,
            max_discharge_kwh_per_hour: b.max_discharge_kwh_per_hour ?? b.maxDischargeKwhPerHour,
          }
        : body.battery,
  };
}
