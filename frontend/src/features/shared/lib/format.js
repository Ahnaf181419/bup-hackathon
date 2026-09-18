/** Shared number formatting for costs, energy and hours. */
export function formatBdt(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatKwh(value, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** [12, 13, 17] -> ["12:00–14:00", "17:00–18:00"]; end is exclusive, matching the directive contract. */
export function hourRanges(hours = []) {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const ranges = [];
  for (const h of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && h === last[1]) last[1] = h + 1;
    else ranges.push([h, h + 1]);
  }
  return ranges.map(([a, b]) => `${formatHour(a)}–${formatHour(b)}`);
}

/** 740 -> ["740", "ms"], 2310 -> ["2.31", "s"]; null when there is no real measurement. */
export function durationParts(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return null;
  return ms < 1000 ? [String(Math.round(ms)), "ms"] : [(ms / 1000).toFixed(2), "s"];
}

export function formatDuration(ms) {
  const p = durationParts(ms);
  return p ? `${p[0]} ${p[1]}` : "—";
}
