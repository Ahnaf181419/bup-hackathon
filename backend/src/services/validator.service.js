import { ValidationError } from "../utils/errors.js";

const TOLERANCE = 0.01;

export function validateSolvedSchedule(planResult, input) {
  const { hourly_plan, total_grid_kwh, total_cost_bdt, peak_grid_kwh } = planResult;
  const { hours, battery } = input;

  if (!Array.isArray(hourly_plan) || hourly_plan.length !== 24) {
    throw new ValidationError("hourly_plan must contain exactly 24 entries (hours 0-23)");
  }

  let recalculatedGrid = 0;
  let recalculatedCost = 0;
  let recalculatedPeak = 0;

  for (let t = 0; t < 24; t++) {
    const p = hourly_plan[t];
    const h = hours[t];

    if (p.hour !== t) {
      throw new ValidationError(`hourly_plan[${t}].hour must be ${t}`);
    }

    const discharge = p.battery_action === "discharge" ? p.battery_kwh : 0;
    const charge = p.battery_action === "charge" ? p.battery_kwh : 0;

    // Energy balance check
    const supplied = p.grid_kwh + p.solar_used_kwh + discharge;
    const demanded = h.demand_kwh + charge;
    const balanceDiff = Math.abs(supplied - demanded);

    if (balanceDiff > TOLERANCE) {
      throw new ValidationError(
        `Hour ${t} energy balance violation: supplied (${supplied.toFixed(2)}) != demanded (${demanded.toFixed(2)})`
      );
    }

    // Battery capacity limits
    if (p.battery_energy_after_kwh > battery.capacity_kwh + TOLERANCE) {
      throw new ValidationError(`Hour ${t} battery energy exceeds capacity ${battery.capacity_kwh}`);
    }

    recalculatedGrid += p.grid_kwh;
    recalculatedCost += p.grid_kwh * h.tariff_bdt_per_kwh;
    if (p.grid_kwh > recalculatedPeak) recalculatedPeak = p.grid_kwh;
  }

  // End-of-day battery neutrality check
  const finalEnergy = hourly_plan[23].battery_energy_after_kwh;
  const initialEnergy = battery.initial_energy_kwh;
  if (Math.abs(finalEnergy - initialEnergy) > TOLERANCE) {
    throw new ValidationError(
      `End-of-day neutrality violation: final energy (${finalEnergy}) != initial energy (${initialEnergy})`
    );
  }

  return true;
}
