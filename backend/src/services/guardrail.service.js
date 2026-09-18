/**
 * Deterministic guardrails between the LLM and the optimizer.
 *
 * Accepts a candidate directive (LLM intermediate format or spec format) and either returns it
 * in the exact Problem Statement shape or rejects it. It never fills in missing values: a
 * directive without a usable window or number is rejected so the caller can fall back.
 *
 * Spec shapes:
 *   solar_reduction          { hours, factor }              factor = usable fraction in [0, 1]
 *   minimum_battery_reserve  { hours, minimum_energy_kwh }  0 <= kWh <= capacity
 *   no_charge_window         { hours }
 *   no_discharge_window      { hours }
 *   max_grid_window          { hours, max_grid_kwh }        kWh >= 0
 *   no_op                    applies=false, structured_adjustment=null
 */

export const DIRECTIVE_TYPES = [
  "solar_reduction",
  "minimum_battery_reserve",
  "no_charge_window",
  "no_discharge_window",
  "max_grid_window",
  "no_op",
];

const TYPE_SET = new Set(DIRECTIVE_TYPES);
const MAX_EXPLANATION = 400;

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v, dp) => Math.round(v * 10 ** dp) / 10 ** dp;

function toNumber(v) {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

/** Expand an hour window. start inclusive, end exclusive, wraps past midnight (22 -> 2 = 22,23,0,1). */
export function expandWindow(start, end) {
  const s = toNumber(start);
  let e = toNumber(end);
  if (s === null || e === null || !Number.isInteger(s) || !Number.isInteger(e)) return null;
  if (e === 0 && s > 0) e = 24; // "until midnight"
  if (s < 0 || s > 23 || e < 0 || e > 24 || s === e) return null;
  const hours = [];
  if (e > s) {
    for (let h = s; h < e; h++) hours.push(h);
  } else {
    for (let h = s; h < 24; h++) hours.push(h);
    for (let h = 0; h < e; h++) hours.push(h);
  }
  return hours;
}

/** Collect hours from any supported representation; returns unique ascending ints or null. */
function extractHours(raw) {
  const collected = [];

  const explicit = Array.isArray(raw.hours) ? raw.hours : Array.isArray(raw.window) ? raw.window : null;
  if (explicit) {
    for (const h of explicit) {
      const n = toNumber(h);
      if (n === null || !Number.isInteger(n) || n < 0 || n > 23) return null;
      collected.push(n);
    }
  }

  const windows = Array.isArray(raw.windows) ? [...raw.windows] : [];
  if (raw.start_hour !== undefined || raw.end_hour !== undefined) {
    windows.push({ start_hour: raw.start_hour, end_hour: raw.end_hour });
  }
  for (const w of windows) {
    if (!w || typeof w !== "object") return null;
    const expanded = expandWindow(w.start_hour, w.end_hour);
    if (!expanded) return null;
    collected.push(...expanded);
  }

  const unique = [...new Set(collected)].sort((a, b) => a - b);
  return unique.length > 0 ? unique : null;
}

function solarFactor(raw) {
  let factor = toNumber(raw.factor ?? raw.usable_solar_fraction);
  if (factor === null) {
    const reduction = toNumber(raw.reduction_percent);
    if (reduction !== null) factor = 1 - reduction / 100;
  }
  if (factor === null) return null;
  // A value like 25 almost certainly means 25 %.
  if (factor > 1 && factor <= 100) factor = factor / 100;
  if (factor < 0 || factor > 1) return null;
  return round(factor, 6);
}

function reserveKwh(raw, battery) {
  let kwh = toNumber(raw.minimum_energy_kwh ?? raw.reserve_kwh ?? raw.reserve_floor_kwh);
  if (kwh === null) {
    const pct = toNumber(raw.reserve_percent_of_capacity);
    if (pct !== null) kwh = (pct / 100) * battery.capacity_kwh;
  }
  if (kwh === null || kwh < 0 || kwh > battery.capacity_kwh + 1e-9) return null;
  return round(kwh, 4);
}

function gridCap(raw) {
  const kwh = toNumber(raw.max_grid_kwh);
  if (kwh === null || kwh < 0) return null;
  return round(kwh, 4);
}

function cleanExplanation(text, fallback) {
  if (typeof text !== "string") return fallback;
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  return t.length > MAX_EXPLANATION ? `${t.slice(0, MAX_EXPLANATION - 1)}…` : t;
}

export function noOp(noteIndex, explanation = "The note does not change energy dispatch for this day.") {
  return {
    note_index: noteIndex,
    applies: false,
    directive_type: "no_op",
    structured_adjustment: null,
    explanation,
  };
}

const hoursLabel = (hours) => `hours ${hours.join(", ")}`;

/**
 * Normalize one candidate. Returns { ok: true, entry } or { ok: false, reason }.
 */
export function normalizeDirective(raw, noteIndex, battery) {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "missing interpretation" };

  const type = typeof raw.directive_type === "string" ? raw.directive_type.trim().toLowerCase() : "";
  if (!TYPE_SET.has(type)) return { ok: false, reason: `unsupported directive_type '${raw.directive_type}'` };

  if (type === "no_op") {
    return { ok: true, entry: noOp(noteIndex, cleanExplanation(raw.explanation, undefined)) };
  }

  const hours = extractHours(raw);
  if (!hours) return { ok: false, reason: `${type}: missing or invalid hour window` };

  let adjustment;
  let defaultExplanation;
  switch (type) {
    case "solar_reduction": {
      const factor = solarFactor(raw);
      if (factor === null) return { ok: false, reason: "solar_reduction: missing or invalid factor" };
      adjustment = { hours, factor };
      defaultExplanation = `Usable solar is ${round(factor * 100, 2)}% of forecast during ${hoursLabel(hours)}.`;
      break;
    }
    case "minimum_battery_reserve": {
      const kwh = reserveKwh(raw, battery);
      if (kwh === null) return { ok: false, reason: "minimum_battery_reserve: missing or out-of-range kWh" };
      adjustment = { hours, minimum_energy_kwh: kwh };
      defaultExplanation = `Battery must hold at least ${kwh} kWh during ${hoursLabel(hours)}.`;
      break;
    }
    case "max_grid_window": {
      const cap = gridCap(raw);
      if (cap === null) return { ok: false, reason: "max_grid_window: missing or invalid max_grid_kwh" };
      adjustment = { hours, max_grid_kwh: cap };
      defaultExplanation = `Grid import is capped at ${cap} kWh per hour during ${hoursLabel(hours)}.`;
      break;
    }
    case "no_charge_window":
      adjustment = { hours };
      defaultExplanation = `Battery charging is not allowed during ${hoursLabel(hours)}.`;
      break;
    case "no_discharge_window":
      adjustment = { hours };
      defaultExplanation = `Battery discharging is not allowed during ${hoursLabel(hours)}.`;
      break;
    default:
      return { ok: false, reason: `unsupported directive_type '${type}'` };
  }

  return {
    ok: true,
    entry: {
      note_index: noteIndex,
      applies: true,
      directive_type: type,
      structured_adjustment: adjustment,
      explanation: cleanExplanation(raw.explanation, defaultExplanation),
    },
  };
}

/**
 * Pick the candidate for each note (matched by note_index, else by position) and normalize it.
 * Returns one result per note: { ok, entry?, reason? }.
 */
export function validateAndSanitizeDirectives(candidates, notesCount, battery) {
  const list = Array.isArray(candidates) ? candidates : [];
  const results = [];
  for (let i = 0; i < notesCount; i++) {
    const byIndex = list.find((c) => c && toNumber(c.note_index) === i);
    const candidate = byIndex ?? (list.length === notesCount ? list[i] : undefined);
    results.push(normalizeDirective(candidate, i, battery));
  }
  return results;
}
