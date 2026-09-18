"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Link from "next/link";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  COLORS,
  axisProps,
  gridProps,
  lineCursorProps,
  ChartTooltip,
  Legend,
  useChartAnimation,
} from "@/features/results/components/chartTheme";

/**
 * Cost per optimization over time — the console's main trend. Reference answers
 * render as hollow dots so real GridWise runs stand out; the best cost on record
 * is a dashed lime floor every run is compared against.
 */
export function CostTrendChart({ points = [], isLoading = false }) {
  const anim = useChartAnimation();

  if (!isLoading && points.length === 0) {
    return (
      <section className="card" aria-labelledby="cost-trend-title">
        <div className="card-header">
          <div>
            <h2 id="cost-trend-title" className="card-title">
              <LineChartIcon size={18} strokeWidth={1.75} aria-hidden="true" />
              Cost trend
            </h2>
            <p className="card-desc">No costed runs yet.</p>
          </div>
        </div>
        <div className="chart-empty">
          <p className="muted">Run an optimization to start the trend line.</p>
          <Link href="/optimize" className="btn-secondary btn-sm">Optimize a scenario</Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="card chart-skeleton" aria-busy="true">
        <div className="card-header">
          <div>
            <h2 className="card-title"><LineChartIcon size={18} strokeWidth={1.75} aria-hidden="true" /> Cost trend</h2>
            <p className="card-desc">Loading runs…</p>
          </div>
        </div>
        <div className="skeleton skeleton-chart" />
      </section>
    );
  }

  const costs = points.map((p) => p.cost);
  const best = Math.min(...costs);
  const pad = (Math.max(...costs) - best) * 0.15 || 500;
  const last = points[points.length - 1];
  const refCount = points.filter((p) => p.ref).length;

  const legend = [
    { label: "Run cost", color: COLORS.grid },
    { label: `Best ${best.toLocaleString("en-US", { maximumFractionDigits: 0 })} BDT`, color: "var(--accent-lime)", dashed: true },
    ...(refCount > 0 ? [{ label: "Reference answer", color: COLORS.axis, dashed: true }] : []),
  ];

  const xTicks = points.map((_, i) => i + 1).filter((n) => n === 1 || n === points.length || n % Math.ceil(points.length / 6) === 0);

  return (
    <section className="card" aria-labelledby="cost-trend-title">
      <div className="card-header">
        <div>
          <h2 id="cost-trend-title" className="card-title">
            <LineChartIcon size={18} strokeWidth={1.75} aria-hidden="true" />
            Cost trend
          </h2>
          <p className="card-desc">
            Total grid cost per optimization, oldest to newest. {points.length} costed {points.length === 1 ? "run" : "runs"} on record.
          </p>
        </div>
        <Legend items={legend} />
      </div>

      <div style={{ width: "100%", height: 264 }} role="img" aria-label={`Line chart of total cost per run. Best cost ${Math.round(best)} taka. Latest run ${last.id} cost ${Math.round(last.cost)} taka.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points.map((p, i) => ({ n: i + 1, ...p }))} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id="costTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.grid} stopOpacity={0.30} />
                <stop offset="100%" stopColor={COLORS.grid} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="n" {...axisProps} ticks={xTicks} tickFormatter={(n) => `#${n}`} minTickGap={16} />
            <YAxis
              {...axisProps}
              width={56}
              domain={[Math.max(0, best - pad), "dataMax + " + pad]}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              cursor={lineCursorProps}
              content={
                <ChartTooltip
                  titleFormatter={(l) => `Run #${l}`}
                  rows={(d) => [
                    { label: "Total cost", value: `${d.cost.toLocaleString("en-US", { maximumFractionDigits: 0 })} BDT`, color: COLORS.grid },
                    { label: d.ref ? "Reference answer" : "EnergiQ run", value: d.id },
                    ...(d.cost === best ? [{ label: "Best on record", value: "", color: "var(--accent-lime)" }] : []),
                  ]}
                />
              }
            />
            <ReferenceLine
              y={best}
              stroke="var(--accent-lime)"
              strokeDasharray="5 4"
              strokeOpacity={0.8}
              label={{ value: "best", position: "insideTopRight", fill: "var(--accent-lime)", fontSize: 10, dy: 8 }}
            />
            <Area
              dataKey="cost"
              type="monotone"
              stroke={COLORS.grid}
              strokeWidth={2}
              fill="url(#costTrendFill)"
              dot={(d) => {
                const isLast = d.index === points.length - 1;
                if (isLast) return <circle key={d.key} cx={d.cx} cy={d.cy} r={4} fill="var(--accent-lime)" stroke="#070b10" strokeWidth={1.5} />;
                if (d.payload.ref) return <circle key={d.key} cx={d.cx} cy={d.cy} r={2.5} fill="#0c1219" stroke={COLORS.axis} strokeWidth={1.25} />;
                return <circle key={d.key} cx={d.cx} cy={d.cy} r={2.5} fill={COLORS.grid} />;
              }}
              activeDot={{ r: 4, fill: COLORS.grid, stroke: "#070b10", strokeWidth: 1.5 }}
              {...anim}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
