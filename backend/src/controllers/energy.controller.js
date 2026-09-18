import { runOptimizationPipeline } from "../services/pipeline.service.js";
import { saveOptimizationResult } from "../services/history.service.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Public Judge Endpoint: POST /optimize-energy
 * Conforms strictly to BUP CSE Fest 2026 Problem Statement
 */
export async function optimizeEnergyPublic(req, res, next) {
  try {
    const input = normalizeInputPayload(req.body);
    const result = await runOptimizationPipeline(input);

    // Return exact judge-facing response format
    return res.status(200).json({
      scenario_id: result.scenario_id,
      directive_interpretation: result.directive_interpretation,
      hourly_plan: result.hourly_plan,
      total_grid_kwh: result.total_grid_kwh,
      total_cost_bdt: result.total_cost_bdt,
      peak_grid_kwh: result.peak_grid_kwh,
      plan_summary: result.plan_summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticated Dashboard Endpoint: POST /api/energy/optimize
 */
export async function optimizeEnergyAuth(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    const input = normalizeInputPayload(req.body);
    const result = await runOptimizationPipeline(input);

    // Save to database
    const savedDoc = await saveOptimizationResult(userId, result, input);

    return res.status(200).json({
      success: true,
      _id: savedDoc._id,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to normalize payload from both camelCase and snake_case
 */
function normalizeInputPayload(body) {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a valid JSON object");
  }

  const scenario_id = body.scenario_id || body.scenarioId;
  if (!scenario_id) {
    throw new ValidationError("scenario_id is required");
  }

  const operator_notes = body.operator_notes || body.operatorNotes;
  if (!Array.isArray(operator_notes) || operator_notes.length < 1 || operator_notes.length > 3) {
    throw new ValidationError("operator_notes must be an array containing between 1 and 3 strings");
  }

  const hours = body.hours;
  if (!Array.isArray(hours) || hours.length !== 24) {
    throw new ValidationError("hours must be an array of exactly 24 entries (0 to 23)");
  }

  const normalizedHours = hours.map((h, i) => {
    const demand = h.demand_kwh ?? h.demandKwh;
    const solar = h.solar_kwh ?? h.solarKwh;
    const tariff = h.tariff_bdt_per_kwh ?? h.tariffBdtPerKwh;

    if (demand === undefined || solar === undefined || tariff === undefined) {
      throw new ValidationError(`hour ${i} is missing required fields (demand_kwh, solar_kwh, tariff_bdt_per_kwh)`);
    }

    return {
      hour: h.hour ?? i,
      demand_kwh: Number(demand),
      solar_kwh: Number(solar),
      tariff_bdt_per_kwh: Number(tariff),
    };
  });

  const b = body.battery;
  if (!b || typeof b !== "object") {
    throw new ValidationError("battery configuration is required");
  }

  const capacity = b.capacity_kwh ?? b.capacityKwh;
  const initial = b.initial_energy_kwh ?? b.initialEnergyKwh;
  const minimum = b.minimum_energy_kwh ?? b.minimumEnergyKwh;
  const maxCharge = b.max_charge_kwh_per_hour ?? b.maxChargeKwhPerHour;
  const maxDischarge = b.max_discharge_kwh_per_hour ?? b.maxDischargeKwhPerHour;

  if (capacity === undefined || initial === undefined || minimum === undefined || maxCharge === undefined || maxDischarge === undefined) {
    throw new ValidationError("battery is missing required configuration fields");
  }

  const normalizedBattery = {
    capacity_kwh: Number(capacity),
    initial_energy_kwh: Number(initial),
    minimum_energy_kwh: Number(minimum),
    max_charge_kwh_per_hour: Number(maxCharge),
    max_discharge_kwh_per_hour: Number(maxDischarge),
  };

  return {
    scenario_id,
    operator_notes,
    hours: normalizedHours,
    battery: normalizedBattery,
  };
}
