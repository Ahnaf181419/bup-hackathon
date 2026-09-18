import { Scenario } from "../models/Scenario.js";
import { NotFoundError } from "../utils/errors.js";

export async function saveScenario(userId, data) {
  const scenario = await Scenario.findOneAndUpdate(
    { userId, scenarioId: data.scenarioId || data.scenario_id },
    {
      userId,
      scenarioId: data.scenarioId || data.scenario_id,
      label: data.label || "",
      description: data.description || "",
      operatorNotes: data.operatorNotes || data.operator_notes,
      hours: (data.hours || []).map((h) => ({
        hour: h.hour,
        demandKwh: h.demandKwh ?? h.demand_kwh,
        solarKwh: h.solarKwh ?? h.solar_kwh,
        tariffBdtPerKwh: h.tariffBdtPerKwh ?? h.tariff_bdt_per_kwh,
      })),
      battery: {
        capacityKwh: data.battery.capacityKwh ?? data.battery.capacity_kwh,
        initialEnergyKwh: data.battery.initialEnergyKwh ?? data.battery.initial_energy_kwh,
        minimumEnergyKwh: data.battery.minimumEnergyKwh ?? data.battery.minimum_energy_kwh,
        maxChargeKwhPerHour: data.battery.maxChargeKwhPerHour ?? data.battery.max_charge_kwh_per_hour,
        maxDischargeKwhPerHour: data.battery.maxDischargeKwhPerHour ?? data.battery.max_discharge_kwh_per_hour,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
  return scenario;
}

export async function getScenariosByUser(userId) {
  try {
    return await Scenario.find({
      $or: [{ userId }, { userId: "public-benchmark" }],
    }).sort({ scenarioId: 1 });
  } catch (err) {
    return [];
  }
}

export async function getScenarioById(userId, id) {
  const scenario = await Scenario.findOne({
    $or: [
      { userId, scenarioId: id },
      { userId: "public-benchmark", scenarioId: id },
      { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
    ],
  });
  if (!scenario) throw new NotFoundError(`Scenario '${id}' not found`);
  return scenario;
}

export async function deleteScenario(userId, id) {
  const deleted = await Scenario.findOneAndDelete({
    userId,
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { scenarioId: id }],
  });
  if (!deleted) throw new NotFoundError(`Scenario '${id}' not found`);
  return deleted;
}

export async function getBenchmarkMeta() {
  try {
    const mongoose = (await import("mongoose")).default;
    return await mongoose.connection.db.collection("benchmark_metadata").findOne({ key: "dataset_meta" });
  } catch (err) {
    return null;
  }
}

