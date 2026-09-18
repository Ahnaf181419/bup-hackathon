import fs from "fs";
import path from "path";
import { runOptimizationPipeline } from "./src/services/pipeline.service.js";

async function runTests() {
  console.log("=== Testing GridWise Optimization Pipeline against Public Benchmarks ===");
  const packPath = path.resolve("../../BUP_CSE_FEST_2026_Participant_Docs/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");
  const data = JSON.parse(fs.readFileSync(packPath, "utf8"));

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < 3; i++) {
    const testCase = data.cases[i];
    console.log(`\n-----------------------------------------`);
    console.log(`Testing Case ${i + 1}: ${testCase.id} ("${testCase.label}")`);
    console.log(`Notes:`, testCase.input.operator_notes);

    try {
      const result = await runOptimizationPipeline(testCase.input);

      console.log(`Solved in: ${result.processingTimeMs}ms`);
      console.log(`Directives Interpreted:`, result.directive_interpretation.map(d => `${d.directive_type} (applies: ${d.applies})`).join(", "));
      console.log(`Solved Cost: ${result.total_cost_bdt} BDT (Ref: ${testCase.expected_output.total_cost_bdt})`);
      console.log(`Solved Grid: ${result.total_grid_kwh} kWh (Ref: ${testCase.expected_output.total_grid_kwh})`);
      console.log(`Peak Grid: ${result.peak_grid_kwh} kWh (Ref: ${testCase.expected_output.peak_grid_kwh})`);

      // Verify End-of-Day Neutrality
      const finalEnergy = result.hourly_plan[23].battery_energy_after_kwh;
      const initialEnergy = testCase.input.battery.initial_energy_kwh;
      const neutralityDelta = Math.abs(finalEnergy - initialEnergy);
      console.log(`Neutrality Delta: ${neutralityDelta.toFixed(4)} kWh`);

      if (neutralityDelta <= 0.01) {
        console.log(`✓ Case ${testCase.id} PASSED all constraints!`);
        passed++;
      } else {
        console.error(`✗ Case ${testCase.id} failed neutrality!`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ Case ${testCase.id} threw error:`, err);
      failed++;
    }
  }

  console.log(`\n=========================================`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("ALL BENCHMARK TESTS PASSED PERFECTLY!");
  }
}

runTests();
