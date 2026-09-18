// GridWise System Constants

export const DIRECTIVE_TYPES = {
  PRESERVE_MINIMUM_STORAGE: "preserve_minimum_storage",
  FORCE_BATTERY_DISCHARGE: "force_battery_discharge",
  FORCE_BATTERY_CHARGE: "force_battery_charge",
  AVOID_GRID_IMPORT: "avoid_grid_import",
  GRID_IMPORT_LIMIT: "grid_import_limit",
  MAINTENANCE_LOCK: "maintenance_lock",
  SOLAR_CURTAILMENT: "solar_curtailment",
  NO_DIRECTIVE: "no_directive",
};

export const BATTERY_ACTIONS = {
  CHARGE: "charge",
  DISCHARGE: "discharge",
  HOLD: "hold",
};

export const OPTIMIZATION_STATUS = {
  OPTIMAL: "optimal",
  FEASIBLE: "feasible",
  INFEASIBLE: "infeasible",
  ERROR: "error",
};

export const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "⚡ Optimize", href: "/optimize", icon: "Zap" },
  { label: "Results & History", href: "/results", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Sliders" },
];

export const DEFAULT_BATTERY_CONFIG = {
  capacity_kwh: 1000,
  initial_energy_kwh: 400,
  minimum_energy_kwh: 150,
  max_charge_kwh_per_hour: 250,
  max_discharge_kwh_per_hour: 250,
};
