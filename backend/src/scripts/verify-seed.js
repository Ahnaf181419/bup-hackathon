import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { Scenario } from "../models/Scenario.js";
import { OptimizationResult } from "../models/OptimizationResult.js";

async function verify() {
  await mongoose.connect(env.MONGO_URI, { dbName: "bup_hackathon" });
  console.log("Connected to db bup_hackathon");

  const jsonPath = path.resolve("../docs/problem/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");
  const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const scenarios = await Scenario.find({ userId: "public-benchmark" }).lean();
  const results = await OptimizationResult.find({ userId: "public-benchmark" }).lean();

  console.log(`Checking MongoDB 'bup_hackathon' database:`);
  console.log(`- Scenarios found in DB: ${scenarios.length} / ${json.cases.length}`);
  console.log(`- Optimization results found in DB: ${results.length} / ${json.cases.length}`);

  let allScenariosMatch = true;
  let allResultsMatch = true;
  let totalDataPointsChecked = 0;

  for (const c of json.cases) {
    const s = scenarios.find((item) => item.scenarioId === c.id);
    if (!s) {
      console.error(`[FAIL] Missing scenario in DB: ${c.id}`);
      allScenariosMatch = false;
      continue;
    }

    // Verify 24 hours of inputs
    if (s.hours.length !== 24) {
      console.error(`[FAIL] ${c.id} hours length is ${s.hours.length}, expected 24`);
      allScenariosMatch = false;
    }
    for (let h = 0; h < 24; h++) {
      const orig = c.input.hours[h];
      const saved = s.hours[h];
      if (
        saved.hour !== orig.hour ||
        saved.demandKwh !== orig.demand_kwh ||
        saved.solarKwh !== orig.solar_kwh ||
        saved.tariffBdtPerKwh !== orig.tariff_bdt_per_kwh
      ) {
        console.error(`[FAIL] ${c.id} hour ${h} data mismatch!`);
        allScenariosMatch = false;
      }
      totalDataPointsChecked += 4;
    }

    // Verify Battery specs
    const bOrig = c.input.battery;
    const bSaved = s.battery;
    if (
      bSaved.capacityKwh !== bOrig.capacity_kwh ||
      bSaved.initialEnergyKwh !== bOrig.initial_energy_kwh ||
      bSaved.minimumEnergyKwh !== bOrig.minimum_energy_kwh ||
      bSaved.maxChargeKwhPerHour !== bOrig.max_charge_kwh_per_hour ||
      bSaved.maxDischargeKwhPerHour !== bOrig.max_discharge_kwh_per_hour
    ) {
      console.error(`[FAIL] ${c.id} battery config mismatch!`);
      allScenariosMatch = false;
    }
    totalDataPointsChecked += 5;

    // Verify Operator Notes
    if (JSON.stringify(s.operatorNotes) !== JSON.stringify(c.input.operator_notes)) {
      console.error(`[FAIL] ${c.id} operator notes mismatch!`);
      allScenariosMatch = false;
    }
    totalDataPointsChecked += c.input.operator_notes.length;

    // Verify Expected Output Result
    const r = results.find((item) => item.scenario_id === c.id);
    if (!r) {
      console.error(`[FAIL] Missing result in DB for ${c.id}`);
      allResultsMatch = false;
      continue;
    }

    if (
      r.total_cost_bdt !== c.expected_output.total_cost_bdt ||
      r.total_grid_kwh !== c.expected_output.total_grid_kwh ||
      r.peak_grid_kwh !== c.expected_output.peak_grid_kwh
    ) {
      console.error(`[FAIL] ${c.id} totals mismatch!`);
      allResultsMatch = false;
    }
    totalDataPointsChecked += 3;

    // Verify 24 hours of hourly plan
    if (r.hourly_plan.length !== 24) {
      console.error(`[FAIL] ${c.id} hourly_plan length is ${r.hourly_plan.length}, expected 24`);
      allResultsMatch = false;
    }
    for (let h = 0; h < 24; h++) {
      const pOrig = c.expected_output.hourly_plan[h];
      const pSaved = r.hourly_plan[h];
      if (
        pSaved.hour !== pOrig.hour ||
        pSaved.grid_kwh !== pOrig.grid_kwh ||
        pSaved.solar_used_kwh !== pOrig.solar_used_kwh ||
        pSaved.battery_action !== pOrig.battery_action ||
        pSaved.battery_kwh !== pOrig.battery_kwh ||
        pSaved.battery_energy_after_kwh !== pOrig.battery_energy_after_kwh
      ) {
        console.error(`[FAIL] ${c.id} hourly plan hour ${h} mismatch!`);
        allResultsMatch = false;
      }
      totalDataPointsChecked += 6;
    }

    // Verify Directive interpretations
    if (r.directive_interpretation.length !== c.expected_output.directive_interpretation.length) {
      console.error(`[FAIL] ${c.id} directives length mismatch!`);
      allResultsMatch = false;
    }
    for (let d = 0; d < r.directive_interpretation.length; d++) {
      const dOrig = c.expected_output.directive_interpretation[d];
      const dSaved = r.directive_interpretation[d];
      if (
        dSaved.note_index !== dOrig.note_index ||
        dSaved.applies !== dOrig.applies ||
        dSaved.directive_type !== dOrig.directive_type
      ) {
        console.error(`[FAIL] ${c.id} directive ${d} mismatch!`);
        allResultsMatch = false;
      }
      totalDataPointsChecked += 4;
    }
  }

  console.log(`\nVerification Summary:`);
  console.log(`- Scenarios Match 100%: ${allScenariosMatch}`);
  console.log(`- Optimization Results Match 100%: ${allResultsMatch}`);
  console.log(`- Total Individual Data Points Audited: ${totalDataPointsChecked}`);

  await mongoose.disconnect();
}

verify().catch(console.error);
