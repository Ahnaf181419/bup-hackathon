import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Scenario } from "../models/Scenario.js";
import { OptimizationResult } from "../models/OptimizationResult.js";

async function seedDatabase() {
  console.log("=== Seeding BUP Hackathon Public Benchmark Cases into MongoDB Atlas ===");
  console.log("Target Database: bup_hackathon");

  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: "bup_hackathon",
      serverSelectionTimeoutMS: 8000,
    });
    console.log("[db] Successfully connected to MongoDB Atlas (database: bup_hackathon)");

    // Path to the benchmark public sample cases JSON
    const dataPath = path.resolve("../docs/problem/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");
    let rawData;
    if (fs.existsSync(dataPath)) {
      rawData = fs.readFileSync(dataPath, "utf8");
    } else {
      const fallbackPath = path.resolve("../../BUP_CSE_FEST_2026_Participant_Docs/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");
      rawData = fs.readFileSync(fallbackPath, "utf8");
    }

    const parsedJson = JSON.parse(rawData);
    const { _meta, cases } = parsedJson;
    console.log(`Found ${cases.length} benchmark cases and dataset _meta in dataset.`);

    // 0. Seed Dataset Metadata & Rubric Rules (_meta)
    if (_meta) {
      await mongoose.connection.db.collection("benchmark_metadata").updateOne(
        { key: "dataset_meta" },
        { $set: { key: "dataset_meta", ..._meta, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log("✓ Seeded dataset _meta and schema definitions to 'benchmark_metadata' collection");
    }

    let scenariosSeeded = 0;
    let resultsSeeded = 0;

    for (const c of cases) {
      const { id, label, input, expected_output } = c;

      // 1. Seed Scenario Template
      const scenarioData = {
        userId: "public-benchmark",
        scenarioId: input.scenario_id,
        label: label || input.scenario_id,
        description: expected_output?.plan_summary || label || "",
        operatorNotes: input.operator_notes,
        hours: input.hours.map((h) => ({
          hour: h.hour,
          demandKwh: h.demand_kwh,
          solarKwh: h.solar_kwh,
          tariffBdtPerKwh: h.tariff_bdt_per_kwh,
        })),
        battery: {
          capacityKwh: input.battery.capacity_kwh,
          initialEnergyKwh: input.battery.initial_energy_kwh,
          minimumEnergyKwh: input.battery.minimum_energy_kwh,
          maxChargeKwhPerHour: input.battery.max_charge_kwh_per_hour,
          maxDischargeKwhPerHour: input.battery.max_discharge_kwh_per_hour,
        },
      };

      await Scenario.findOneAndUpdate(
        { userId: "public-benchmark", scenarioId: input.scenario_id },
        scenarioData,
        { upsert: true, new: true }
      );
      scenariosSeeded++;

      // 2. Seed Solved Optimization Result if available
      if (expected_output) {
        const resultData = {
          userId: "public-benchmark",
          scenario_id: expected_output.scenario_id,
          directive_interpretation: expected_output.directive_interpretation,
          hourly_plan: expected_output.hourly_plan,
          total_grid_kwh: expected_output.total_grid_kwh,
          total_cost_bdt: expected_output.total_cost_bdt,
          peak_grid_kwh: expected_output.peak_grid_kwh,
          plan_summary: expected_output.plan_summary,
          status: "optimal",
          processingTimeMs: 0, // reference answer from the sample pack, not a GridWise run
          scenario_input: input,
        };

        await OptimizationResult.findOneAndUpdate(
          { userId: "public-benchmark", scenario_id: expected_output.scenario_id },
          resultData,
          { upsert: true, new: true }
        );
        resultsSeeded++;
      }

      console.log(`✓ Seeded ${id}: "${label}"`);
    }

    console.log(`\n=========================================`);
    console.log(`Seeding Completed Successfully:`);
    console.log(`- Scenarios Collection: ${scenariosSeeded} documents`);
    console.log(`- Optimization Results Collection: ${resultsSeeded} documents`);
    console.log(`- Database Name: bup_hackathon`);
    console.log(`=========================================`);
  } catch (err) {
    console.error("[seed] Error seeding database:", err);
  } finally {
    await mongoose.disconnect();
    console.log("[db] Disconnected from MongoDB Atlas.");
    process.exit(0);
  }
}

seedDatabase();
