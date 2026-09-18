import { ValidationError, UnprocessableError } from "../utils/errors.js";

const BATTERY_FIELDS = [
  "capacity_kwh",
  "initial_energy_kwh",
  "minimum_energy_kwh",
  "max_charge_kwh_per_hour",
  "max_discharge_kwh_per_hour",
];
const HOUR_FIELDS = ["demand_kwh", "solar_kwh", "tariff_bdt_per_kwh"];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNonNegativeNumber = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/**
 * Validates a POST /optimize-energy body against the Problem Statement contract.
 * Structural problems -> 400, semantically impossible values -> 422.
 * Returns a clean copy with hours sorted by `hour` (never mutates the caller's object).
 */
export function validateOptimizeRequest(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  const { scenario_id, operator_notes, hours, battery } = body;

  if (typeof scenario_id !== "string" || scenario_id.trim() === "") {
    errors.push("scenario_id must be a non-empty string");
  }

  if (!Array.isArray(operator_notes) || operator_notes.length < 1 || operator_notes.length > 3) {
    errors.push("operator_notes must be an array of 1 to 3 strings");
  } else {
    operator_notes.forEach((note, i) => {
      if (typeof note !== "string" || note.trim() === "") {
        errors.push(`operator_notes[${i}] must be a non-empty string`);
      }
    });
  }

  let cleanHours = [];
  if (!Array.isArray(hours) || hours.length !== 24) {
    errors.push("hours must be an array of exactly 24 entries");
  } else {
    const seen = new Set();
    hours.forEach((h, i) => {
      if (!isPlainObject(h)) {
        errors.push(`hours[${i}] must be an object`);
        return;
      }
      if (!Number.isInteger(h.hour) || h.hour < 0 || h.hour > 23) {
        errors.push(`hours[${i}].hour must be an integer from 0 to 23`);
      } else if (seen.has(h.hour)) {
        errors.push(`hours[${i}].hour ${h.hour} is duplicated`);
      } else {
        seen.add(h.hour);
      }
      for (const field of HOUR_FIELDS) {
        if (!isNonNegativeNumber(h[field])) {
          errors.push(`hours[${i}].${field} must be a finite number >= 0`);
        }
      }
    });
    if (errors.length === 0) {
      cleanHours = hours
        .map((h) => ({
          hour: h.hour,
          demand_kwh: h.demand_kwh,
          solar_kwh: h.solar_kwh,
          tariff_bdt_per_kwh: h.tariff_bdt_per_kwh,
        }))
        .sort((a, b) => a.hour - b.hour);
    }
  }

  let cleanBattery = null;
  if (!isPlainObject(battery)) {
    errors.push("battery must be an object");
  } else {
    for (const field of BATTERY_FIELDS) {
      if (!isNonNegativeNumber(battery[field])) {
        errors.push(`battery.${field} must be a finite number >= 0`);
      }
    }
    if (errors.length === 0) {
      cleanBattery = Object.fromEntries(BATTERY_FIELDS.map((f) => [f, battery[f]]));
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Invalid request", errors);
  }

  // Semantic checks (structure is fine, values are physically impossible)
  const b = cleanBattery;
  const semantic = [];
  if (b.minimum_energy_kwh > b.capacity_kwh) {
    semantic.push("battery.minimum_energy_kwh cannot exceed battery.capacity_kwh");
  }
  if (b.initial_energy_kwh < b.minimum_energy_kwh || b.initial_energy_kwh > b.capacity_kwh) {
    semantic.push("battery.initial_energy_kwh must be between minimum_energy_kwh and capacity_kwh");
  }
  if (semantic.length > 0) {
    throw new UnprocessableError("Battery parameters are inconsistent", semantic);
  }

  return {
    scenario_id,
    operator_notes: [...operator_notes],
    hours: cleanHours,
    battery: cleanBattery,
  };
}
