import solver from "javascript-lp-solver";
import { InfeasibleError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const DP = 4; // output precision (judge tolerance is 0.01)
const EPS = 1e-6;
const round = (v) => {
  const r = Math.round(v * 10 ** DP) / 10 ** DP;
  return Object.is(r, -0) ? 0 : r;
};

/**
 * Turn guardrailed directives into per-hour limits. Overlaps resolve to the strictest value.
 * Base inputs (demand, tariff, battery params) are never modified.
 */
export function buildHourlyLimits(hours, battery, directives) {
  const limits = hours.map((h) => ({
    effectiveSolar: h.solar_kwh,
    solarFactor: 1,
    minEnergy: battery.minimum_energy_kwh,
    maxCharge: battery.max_charge_kwh_per_hour,
    maxDischarge: battery.max_discharge_kwh_per_hour,
    maxGrid: Infinity,
  }));

  for (const d of directives) {
    if (!d.applies || !d.structured_adjustment) continue;
    const adj = d.structured_adjustment;
    for (const h of adj.hours) {
      const L = limits[h];
      switch (d.directive_type) {
        case "solar_reduction":
          L.solarFactor = Math.min(L.solarFactor, adj.factor);
          break;
        case "minimum_battery_reserve":
          L.minEnergy = Math.max(L.minEnergy, adj.minimum_energy_kwh);
          break;
        case "no_charge_window":
          L.maxCharge = 0;
          break;
        case "no_discharge_window":
          L.maxDischarge = 0;
          break;
        case "max_grid_window":
          L.maxGrid = Math.min(L.maxGrid, adj.max_grid_kwh);
          break;
      }
    }
  }
  limits.forEach((L, t) => {
    L.effectiveSolar = hours[t].solar_kwh * L.solarFactor;
  });
  return limits;
}

function hourRanges(list) {
  if (list.length === 0) return "";
  const parts = [];
  let start = list[0];
  let prev = list[0];
  for (const h of list.slice(1).concat([null])) {
    if (h !== null && h === prev + 1) {
      prev = h;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = h;
  }
  return parts.join(", ");
}

function buildSummary({ plan, hours, battery, directives, totalGrid, totalCost, peakGrid }) {
  const charging = plan.filter((p) => p.battery_action === "charge").map((p) => p.hour);
  const discharging = plan.filter((p) => p.battery_action === "discharge").map((p) => p.hour);
  const avgTariff = (hs) => (hs.reduce((s, h) => s + hours[h].tariff_bdt_per_kwh, 0) / hs.length).toFixed(2);
  const applied = directives.filter((d) => d.applies).map((d) => d.directive_type.replace(/_/g, " "));

  const parts = [
    `Minimum-cost 24-hour plan: grid import ${totalGrid.toFixed(2)} kWh costing ${totalCost.toFixed(2)} BDT, peak ${peakGrid.toFixed(2)} kWh/h.`,
  ];
  parts.push(applied.length ? `Applied ${applied.length} directive(s): ${applied.join(", ")}.` : "No operator directive changed the constraints.");
  if (charging.length) parts.push(`Battery charges in hours ${hourRanges(charging)} (avg tariff ${avgTariff(charging)} BDT/kWh).`);
  if (discharging.length) parts.push(`Battery discharges in hours ${hourRanges(discharging)} (avg tariff ${avgTariff(discharging)} BDT/kWh).`);
  parts.push(`Battery ends the day at ${battery.initial_energy_kwh} kWh, matching its starting energy.`);
  return parts.join(" ");
}

export function solveEnergyDispatch({ scenario_id, hours, battery, directive_interpretation = [] }) {
  const limits = buildHourlyLimits(hours, battery, directive_interpretation);

  const model = { optimize: "cost", opType: "min", constraints: {}, variables: {} };

  for (let t = 0; t < 24; t++) {
    const h = hours[t];
    const L = limits[t];

    // grid + solar_used + discharge - charge = demand
    model.constraints[`bal_${t}`] = { equal: h.demand_kwh };
    model.constraints[`sol_${t}`] = { max: L.effectiveSolar };
    model.constraints[`chg_${t}`] = { max: L.maxCharge };
    model.constraints[`dis_${t}`] = { max: L.maxDischarge };
    model.constraints[`emax_${t}`] = { max: battery.capacity_kwh };
    model.constraints[`emin_${t}`] = { min: L.minEnergy };
    // E_t - E_{t-1} - charge_t + discharge_t = 0   (E_{-1} = initial energy)
    model.constraints[`flow_${t}`] = { equal: t === 0 ? battery.initial_energy_kwh : 0 };

    const grid = { cost: h.tariff_bdt_per_kwh, [`bal_${t}`]: 1 };
    if (Number.isFinite(L.maxGrid)) {
      model.constraints[`gcap_${t}`] = { max: L.maxGrid };
      grid[`gcap_${t}`] = 1;
    }
    model.variables[`grid_${t}`] = grid;
    model.variables[`solar_${t}`] = { [`bal_${t}`]: 1, [`sol_${t}`]: 1 };
    // Tiny throughput cost discourages pointless simultaneous charge + discharge.
    model.variables[`chg_${t}`] = { cost: 1e-6, [`bal_${t}`]: -1, [`chg_${t}`]: 1, [`flow_${t}`]: -1 };
    model.variables[`dis_${t}`] = { cost: 1e-6, [`bal_${t}`]: 1, [`dis_${t}`]: 1, [`flow_${t}`]: 1 };

    const energy = { [`emax_${t}`]: 1, [`emin_${t}`]: 1, [`flow_${t}`]: 1 };
    if (t < 23) energy[`flow_${t + 1}`] = -1;
    else {
      energy.end_neutral = 1;
      model.constraints.end_neutral = { equal: battery.initial_energy_kwh };
    }
    model.variables[`energy_${t}`] = energy;
  }

  const res = solver.Solve(model);
  if (!res.feasible || res.bounded === false) {
    logger.warn(`[optimizer] scenario '${scenario_id}' is infeasible under the interpreted directives`);
    throw new InfeasibleError(
      "No schedule satisfies the battery limits, end-of-day neutrality and the interpreted directives together."
    );
  }

  // Post-process: net charge/discharge into one action, carry energy forward from the rounded
  // actions, and recompute grid from the balance so every rule replays exactly.
  const plan = [];
  let energy = battery.initial_energy_kwh;
  for (let t = 0; t < 24; t++) {
    const h = hours[t];
    const net = (res[`chg_${t}`] || 0) - (res[`dis_${t}`] || 0);
    let action = "idle";
    let batteryKwh = 0;
    if (net > EPS) {
      action = "charge";
      batteryKwh = round(net);
    } else if (net < -EPS) {
      action = "discharge";
      batteryKwh = round(-net);
    }
    if (batteryKwh === 0) action = "idle";

    const charge = action === "charge" ? batteryKwh : 0;
    const discharge = action === "discharge" ? batteryKwh : 0;
    energy = round(energy + charge - discharge);

    let solarUsed = round(Math.min(Math.max(res[`solar_${t}`] || 0, 0), limits[t].effectiveSolar));
    let grid = round(h.demand_kwh + charge - solarUsed - discharge);
    if (grid < 0) {
      // Numerical noise: spill the excess solar instead of exporting.
      solarUsed = round(solarUsed + grid);
      grid = 0;
    }

    plan.push({
      hour: h.hour,
      grid_kwh: grid,
      solar_used_kwh: solarUsed,
      battery_action: action,
      battery_kwh: batteryKwh,
      battery_energy_after_kwh: energy,
    });
  }

  const totalGrid = round(plan.reduce((s, p) => s + p.grid_kwh, 0));
  const totalCost = round(plan.reduce((s, p, t) => s + p.grid_kwh * hours[t].tariff_bdt_per_kwh, 0));
  const peakGrid = round(Math.max(...plan.map((p) => p.grid_kwh)));

  return {
    scenario_id,
    directive_interpretation,
    hourly_plan: plan,
    total_grid_kwh: totalGrid,
    total_cost_bdt: totalCost,
    peak_grid_kwh: peakGrid,
    plan_summary: buildSummary({ plan, hours, battery, directives: directive_interpretation, totalGrid, totalCost, peakGrid }),
  };
}
