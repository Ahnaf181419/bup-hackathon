// GridWise System Constants

// Must match the Problem Statement / backend guardrails exactly.
export const DIRECTIVE_TYPES = {
  SOLAR_REDUCTION: "solar_reduction",
  MINIMUM_BATTERY_RESERVE: "minimum_battery_reserve",
  NO_CHARGE_WINDOW: "no_charge_window",
  NO_DISCHARGE_WINDOW: "no_discharge_window",
  MAX_GRID_WINDOW: "max_grid_window",
  NO_OP: "no_op",
};

export const BATTERY_ACTIONS = {
  CHARGE: "charge",
  DISCHARGE: "discharge",
  IDLE: "idle",
};

// Display label only; the backend's GEMINI_MODEL env var decides the model actually used.
export const LLM_MODEL_LABEL = process.env.NEXT_PUBLIC_LLM_MODEL_LABEL || "Google Gemini (gemini-3.1-flash-lite)";

export const OPTIMIZATION_STATUS = {
  OPTIMAL: "optimal",
  FEASIBLE: "feasible",
  INFEASIBLE: "infeasible",
  ERROR: "error",
};

export const DEFAULT_BATTERY_CONFIG = {
  capacity_kwh: 1000,
  initial_energy_kwh: 400,
  minimum_energy_kwh: 150,
  max_charge_kwh_per_hour: 250,
  max_discharge_kwh_per_hour: 250,
};
