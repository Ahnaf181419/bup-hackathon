import { AppError } from "../utils/errors.js";
import { buildHourlyLimits } from "./optimizer.service.js";

const TOL = 0.01;
const ACTIONS = new Set(["charge", "discharge", "idle"]);

/**
 * Replays a plan against every rule in the Problem Statement. Returns a list of violations
 * (empty = valid). Shared by the pipeline and the sample test script.
 */
export function findPlanViolations(result, { hours, battery }) {
  const v = [];
  const plan = result.hourly_plan;
  const directives = result.directive_interpretation || [];

  if (!Array.isArray(plan) || plan.length !== 24) return ["hourly_plan must have 24 entries"];

  const limits = buildHourlyLimits(hours, battery, directives);
  const isNum = (x) => typeof x === "number" && Number.isFinite(x);
  let energy = battery.initial_energy_kwh;
  let grid = 0;
  let cost = 0;
  let peak = 0;

  plan.forEach((p, t) => {
    const h = hours[t];
    const L = limits[t];
    if (p.hour !== h.hour) v.push(`plan[${t}].hour should be ${h.hour}`);
    for (const k of ["grid_kwh", "solar_used_kwh", "battery_kwh", "battery_energy_after_kwh"]) {
      if (!isNum(p[k]) || p[k] < 0) v.push(`hour ${t}: ${k} must be a finite number >= 0`);
    }
    if (!ACTIONS.has(p.battery_action)) v.push(`hour ${t}: invalid battery_action`);
    if (p.battery_action === "idle" && p.battery_kwh !== 0) v.push(`hour ${t}: idle requires battery_kwh = 0`);

    const charge = p.battery_action === "charge" ? p.battery_kwh : 0;
    const discharge = p.battery_action === "discharge" ? p.battery_kwh : 0;

    if (Math.abs(p.grid_kwh + p.solar_used_kwh + discharge - h.demand_kwh - charge) > TOL) v.push(`hour ${t}: energy balance`);
    if (p.solar_used_kwh > L.effectiveSolar + TOL) v.push(`hour ${t}: solar used exceeds effective solar`);
    if (charge > L.maxCharge + TOL) v.push(`hour ${t}: charge limit / no-charge window`);
    if (discharge > L.maxDischarge + TOL) v.push(`hour ${t}: discharge limit / no-discharge window`);
    if (p.grid_kwh > L.maxGrid + TOL) v.push(`hour ${t}: grid cap`);

    energy += charge - discharge;
    if (Math.abs(energy - p.battery_energy_after_kwh) > TOL) v.push(`hour ${t}: battery transition`);
    if (p.battery_energy_after_kwh < L.minEnergy - TOL) v.push(`hour ${t}: below minimum/reserve energy`);
    if (p.battery_energy_after_kwh > battery.capacity_kwh + TOL) v.push(`hour ${t}: above capacity`);

    grid += p.grid_kwh;
    cost += p.grid_kwh * h.tariff_bdt_per_kwh;
    peak = Math.max(peak, p.grid_kwh);
  });

  if (Math.abs(plan[23].battery_energy_after_kwh - battery.initial_energy_kwh) > TOL) v.push("end-of-day energy must equal initial energy");
  if (Math.abs(grid - result.total_grid_kwh) > TOL) v.push("total_grid_kwh mismatch");
  if (Math.abs(cost - result.total_cost_bdt) > TOL) v.push("total_cost_bdt mismatch");
  if (Math.abs(peak - result.peak_grid_kwh) > TOL) v.push("peak_grid_kwh mismatch");
  return v;
}

export function validateSolvedSchedule(result, input) {
  const violations = findPlanViolations(result, input);
  if (violations.length > 0) {
    // Our own bug, not the caller's: surface as a generic 500 (details are logged, not returned).
    throw new AppError(`Plan failed final validation: ${violations.slice(0, 5).join("; ")}`, 500);
  }
  return true;
}
