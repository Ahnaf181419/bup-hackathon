"use client";

import React from "react";

/** Shared Recharts styling so every chart reads as one system. Colours mirror the --data-* tokens. */
export const COLORS = {
  solar: "#fbbf24",
  grid: "#38bdf8",
  battery: "#34d399",
  demand: "#e2e8f0",
  limit: "#f87171",
  reserve: "#c4b5fd",
  axis: "#7f8ca1",
  gridline: "rgba(255,255,255,0.06)",
};

export const SYNC_ID = "plan";

export const axisProps = {
  stroke: COLORS.axis,
  tick: { fill: COLORS.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.12)" },
};

export const hourTicks = ["00", "03", "06", "09", "12", "15", "18", "21"];

export const gridProps = { stroke: COLORS.gridline, vertical: false };

export const cursorProps = { fill: "rgba(255,255,255,0.04)" };
export const lineCursorProps = { stroke: "rgba(255,255,255,0.25)", strokeDasharray: "3 3" };

/**
 * Tooltip body. `rows` receives the hovered data point and returns [{label, value, color}].
 */
export function ChartTooltip({ active, payload, label, rows, titleFormatter }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{titleFormatter ? titleFormatter(label, point) : `${label}:00`}</div>
      {rows(point)
        .filter((r) => r.label)
        .map((r) => (
        <div key={r.label} className="chart-tooltip-row">
          <span>
            {r.color && <i className="swatch" style={{ background: r.color }} />}
            {r.label}
          </span>
          {r.value !== "" && <strong className="tabular">{r.value}</strong>}
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((it) => (
        <li key={it.label}>
          <i className={`swatch ${it.dashed ? "dashed" : ""}`} style={{ background: it.dashed ? "none" : it.color, borderColor: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function subscribeReducedMotion(cb) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Chart draw-in animation is skipped for users who ask for reduced motion. */
export function useChartAnimation() {
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  );
  return { isAnimationActive: !reduced, animationDuration: 500, animationEasing: "ease-out" };
}

/** Per-hour limit from directives of one type, or null when the hour is unconstrained. */
export function directiveSeries(directives = [], type, field, pick = Math.max) {
  const out = Array(24).fill(null);
  for (const d of directives) {
    if (d.directive_type !== type || !d.applies || !d.structured_adjustment) continue;
    const value = d.structured_adjustment[field];
    if (typeof value !== "number") continue;
    for (const h of d.structured_adjustment.hours || []) {
      if (h >= 0 && h < 24) out[h] = out[h] === null ? value : pick(out[h], value);
    }
  }
  return out;
}
