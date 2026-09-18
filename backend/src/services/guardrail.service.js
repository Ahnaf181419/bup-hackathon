import { logger } from "../utils/logger.js";

const VALID_DIRECTIVES = new Set([
  "solar_reduction",
  "minimum_battery_reserve",
  "no_charge_window",
  "no_discharge_window",
  "max_grid_window",
  "no_op",
]);

export function validateAndSanitizeDirectives(rawInterpretations, notesCount, battery = {}) {
  const sanitized = [];

  for (let idx = 0; idx < notesCount; idx++) {
    const item = rawInterpretations?.[idx] || {
      note_index: idx,
      applies: false,
      directive_type: "no_op",
      structured_adjustment: null,
      explanation: "No directive provided.",
    };

    let { note_index, applies, directive_type, structured_adjustment, explanation } = item;

    // Ensure note_index is sequential
    note_index = idx;

    // Validate directive type enum
    if (!VALID_DIRECTIVES.has(directive_type)) {
      logger.warn(`[guardrail] Unknown directive_type '${directive_type}'. Coercing to 'no_op'.`);
      directive_type = "no_op";
      applies = false;
      structured_adjustment = null;
    }

    // Enforce no_op invariant
    if (directive_type === "no_op") {
      applies = false;
      structured_adjustment = null;
      explanation = explanation || "Note does not impose physical constraints.";
    } else {
      applies = true;
      structured_adjustment = sanitizeAdjustment(directive_type, structured_adjustment, battery);
    }

    sanitized.push({
      note_index,
      applies,
      directive_type,
      structured_adjustment,
      explanation: explanation || `Applied ${directive_type} constraint.`,
    });
  }

  return sanitized;
}

function sanitizeAdjustment(type, adj, battery) {
  if (!adj || typeof adj !== "object") {
    adj = {};
  }

  // Sanitize hour window (convert to unique ascending integers 0-23)
  let window = Array.isArray(adj.window) ? adj.window : Array.isArray(adj.hours) ? adj.hours : [];
  window = [...new Set(window.map((h) => parseInt(h, 10)))]
    .filter((h) => !isNaN(h) && h >= 0 && h <= 23)
    .sort((a, b) => a - b);

  if (window.length === 0) {
    // Default fallback window if LLM missed it
    window = [12, 13];
  }

  const result = { window };

  if (type === "solar_reduction") {
    let factor = typeof adj.factor === "number" ? adj.factor : 0.25;
    result.factor = Math.max(0, Math.min(1, factor));
  } else if (type === "minimum_battery_reserve") {
    let floor = typeof adj.reserve_floor_kwh === "number" ? adj.reserve_floor_kwh : (battery.minimum_energy_kwh || 150);
    // Floor cannot exceed total battery capacity
    const maxAllowed = battery.capacity_kwh || 1000;
    result.reserve_floor_kwh = Math.min(maxAllowed, Math.max(battery.minimum_energy_kwh || 0, floor));
  } else if (type === "max_grid_window") {
    let cap = typeof adj.max_grid_kwh === "number" ? adj.max_grid_kwh : 200;
    result.max_grid_kwh = Math.max(0, cap);
  }

  return result;
}
