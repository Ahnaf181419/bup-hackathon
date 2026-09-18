import solver from "javascript-lp-solver";
import { InfeasibleError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function solveEnergyDispatch({ scenario_id, hours, battery, directive_interpretation = [] }) {
  const model = {
    optimize: "cost",
    opType: "min",
    constraints: {},
    variables: {},
  };

  // 1. Prepare directive overlays across 24 hours
  const solarFactor = Array(24).fill(1.0);
  const minReserve = Array(24).fill(battery.minimum_energy_kwh);
  const maxChargeRate = Array(24).fill(battery.max_charge_kwh_per_hour);
  const maxDischargeRate = Array(24).fill(battery.max_discharge_kwh_per_hour);
  const maxGridLimit = Array(24).fill(Infinity);

  for (const item of directive_interpretation) {
    if (!item.applies || !item.structured_adjustment) continue;
    const adj = item.structured_adjustment;
    const window = adj.window || [];

    for (const h of window) {
      if (h < 0 || h > 23) continue;

      if (item.directive_type === "solar_reduction") {
        const f = typeof adj.factor === "number" ? adj.factor : 1.0;
        solarFactor[h] = Math.min(solarFactor[h], f);
      } else if (item.directive_type === "minimum_battery_reserve") {
        const floor = typeof adj.reserve_floor_kwh === "number" ? adj.reserve_floor_kwh : battery.minimum_energy_kwh;
        minReserve[h] = Math.max(minReserve[h], floor);
      } else if (item.directive_type === "no_charge_window") {
        maxChargeRate[h] = 0;
      } else if (item.directive_type === "no_discharge_window") {
        maxDischargeRate[h] = 0;
      } else if (item.directive_type === "max_grid_window") {
        const cap = typeof adj.max_grid_kwh === "number" ? adj.max_grid_kwh : Infinity;
        maxGridLimit[h] = Math.min(maxGridLimit[h], cap);
      }
    }
  }

  // 2. Global peak variable for secondary objective (load leveling among cost-equivalent schedules)
  model.variables["peak"] = { cost: 0.001 };

  // 3. Build 24-hour constraints and variables
  for (let t = 0; t < 24; t++) {
    const h = hours[t];
    const effSolar = h.solar_kwh * solarFactor[t];

    model.constraints[`bal_${t}`] = { equal: h.demand_kwh };
    model.constraints[`sol_cap_${t}`] = { max: effSolar };
    model.constraints[`chg_cap_${t}`] = { max: maxChargeRate[t] };
    model.constraints[`dis_cap_${t}`] = { max: maxDischargeRate[t] };
    model.constraints[`bat_max_${t}`] = { max: battery.capacity_kwh };
    model.constraints[`bat_min_${t}`] = { min: minReserve[t] };
    model.constraints[`peak_cap_${t}`] = { max: 0 };

    if (maxGridLimit[t] < Infinity) {
      model.constraints[`grid_cap_${t}`] = { max: maxGridLimit[t] };
    }

    if (t === 0) {
      model.constraints["flow_0"] = { equal: battery.initial_energy_kwh };
    } else {
      model.constraints[`flow_${t}`] = { equal: 0 };
    }

    // Grid Import Variable
    const gridVar = {
      cost: h.tariff_bdt_per_kwh,
      [`bal_${t}`]: 1,
      [`peak_cap_${t}`]: 1,
    };
    if (maxGridLimit[t] < Infinity) {
      gridVar[`grid_cap_${t}`] = 1;
    }
    model.variables[`grid_${t}`] = gridVar;
    model.variables["peak"][`peak_cap_${t}`] = -1;

    // Solar Used Variable
    model.variables[`solar_${t}`] = {
      [`bal_${t}`]: 1,
      [`sol_cap_${t}`]: 1,
    };

    // Battery Charge Variable (tiny penalty prevents simultaneous charge/discharge)
    model.variables[`charge_${t}`] = {
      cost: 0.00001,
      [`bal_${t}`]: -1,
      [`chg_cap_${t}`]: 1,
      [`flow_${t}`]: -1,
    };

    // Battery Discharge Variable
    model.variables[`dischg_${t}`] = {
      cost: 0.00001,
      [`bal_${t}`]: 1,
      [`dis_cap_${t}`]: 1,
      [`flow_${t}`]: 1,
    };

    // Battery Energy Level After Hour Variable
    const energyVar = {
      [`bat_max_${t}`]: 1,
      [`bat_min_${t}`]: 1,
      [`flow_${t}`]: 1,
    };
    if (t < 23) {
      energyVar[`flow_${t + 1}`] = -1;
    }
    if (t === 23) {
      energyVar["end_neutrality"] = 1;
      model.constraints["end_neutrality"] = { equal: battery.initial_energy_kwh };
    }
    model.variables[`energy_${t}`] = energyVar;
  }

  // 4. Solve the LP Model
  const res = solver.Solve(model);

  if (!res.feasible) {
    logger.error(`[optimizer] LP Solver determined scenario '${scenario_id}' is infeasible.`);
    throw new InfeasibleError(`No feasible 24-hour energy dispatch exists for scenario '${scenario_id}'.`);
  }

  // 5. Post-Process the Solved Schedule
  let totalGrid = 0;
  let totalCost = 0;
  let peakGrid = 0;

  const hourlyPlan = [];

  for (let t = 0; t < 24; t++) {
    const rawGrid = res[`grid_${t}`] || 0;
    const rawSolar = res[`solar_${t}`] || 0;
    const rawCharge = res[`charge_${t}`] || 0;
    const rawDischg = res[`dischg_${t}`] || 0;
    const rawEnergy = res[`energy_${t}`] || battery.initial_energy_kwh;

    let action = "idle";
    let batteryKwh = 0;

    if (rawCharge > 0.001 && rawCharge >= rawDischg) {
      action = "charge";
      batteryKwh = Math.round((rawCharge - rawDischg) * 100) / 100;
    } else if (rawDischg > 0.001 && rawDischg > rawCharge) {
      action = "discharge";
      batteryKwh = Math.round((rawDischg - rawCharge) * 100) / 100;
    }

    const gridKwh = Math.round(rawGrid * 100) / 100;
    const solarUsedKwh = Math.round(rawSolar * 100) / 100;
    const energyAfterKwh = Math.round(rawEnergy * 100) / 100;

    totalGrid += gridKwh;
    totalCost += gridKwh * hours[t].tariff_bdt_per_kwh;
    if (gridKwh > peakGrid) peakGrid = gridKwh;

    hourlyPlan.push({
      hour: t,
      grid_kwh: gridKwh,
      solar_used_kwh: solarUsedKwh,
      battery_action: action,
      battery_kwh: batteryKwh,
      battery_energy_after_kwh: energyAfterKwh,
    });
  }

  totalGrid = Math.round(totalGrid * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;
  peakGrid = Math.round(peakGrid * 100) / 100;

  const summary = `Optimal 24-hour campus dispatch for scenario '${scenario_id}' achieved total cost of ${totalCost.toFixed(2)} BDT with peak grid draw of ${peakGrid.toFixed(2)} kWh. Battery neutrality verified at hour 23.`;

  return {
    scenario_id,
    directive_interpretation,
    hourly_plan: hourlyPlan,
    total_grid_kwh: totalGrid,
    total_cost_bdt: totalCost,
    peak_grid_kwh: peakGrid,
    plan_summary: summary,
  };
}
