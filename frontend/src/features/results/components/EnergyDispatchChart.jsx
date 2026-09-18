"use client";

import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";
import {
  COLORS,
  SYNC_ID,
  axisProps,
  gridProps,
  hourTicks,
  cursorProps,
  ChartTooltip,
  Legend,
  useChartAnimation,
  directiveSeries,
} from "./chartTheme";

const kwh = (v) => `${(v ?? 0).toFixed(1)} kWh`;

/** Supply per hour (solar, battery discharge, grid) above zero, battery charging below, demand as a line. */
export function EnergyDispatchChart({ plan, hours = [], directives = [] }) {
  const anim = useChartAnimation();
  if (!plan || plan.length === 0) return null;

  const demandByHour = new Map(hours.map((h) => [h.hour, h.demand_kwh]));
  const gridCap = directiveSeries(directives, "max_grid_window", "max_grid_kwh", Math.min);
  const hasCap = gridCap.some((v) => v !== null);

  const data = plan.map((p) => ({
    h: String(p.hour).padStart(2, "0"),
    solar: p.solar_used_kwh || 0,
    discharge: p.battery_action === "discharge" ? p.battery_kwh : 0,
    grid: p.grid_kwh || 0,
    charge: p.battery_action === "charge" ? -p.battery_kwh : 0,
    demand: demandByHour.has(p.hour) ? demandByHour.get(p.hour) : null,
    cap: gridCap[p.hour],
  }));

  const legend = [
    { label: "Solar used", color: COLORS.solar },
    { label: "Battery discharge", color: COLORS.battery },
    { label: "Grid import", color: COLORS.grid },
    { label: "Battery charging (below 0)", color: "rgba(52,211,153,0.45)" },
    ...(data.some((d) => d.demand !== null) ? [{ label: "Demand", color: COLORS.demand }] : []),
    ...(hasCap ? [{ label: "Grid cap", color: COLORS.limit, dashed: true }] : []),
  ];

  return (
    <section className="card" aria-labelledby="dispatch-title">
      <div className="card-header">
        <div>
          <h2 id="dispatch-title" className="card-title">
            <Activity size={18} strokeWidth={1.75} aria-hidden="true" />
            Hourly dispatch
          </h2>
          <p className="card-desc">Where each hour&apos;s energy comes from. Bars above zero meet demand plus any battery charging.</p>
        </div>
        <Legend items={legend} />
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={SYNC_ID} stackOffset="sign" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="h" {...axisProps} ticks={hourTicks} />
            <YAxis {...axisProps} width={48} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Tooltip
              cursor={cursorProps}
              content={
                <ChartTooltip
                  rows={(d) => [
                    ...(d.demand !== null ? [{ label: "Demand", value: kwh(d.demand), color: COLORS.demand }] : []),
                    { label: "Solar used", value: kwh(d.solar), color: COLORS.solar },
                    { label: "Battery discharge", value: kwh(d.discharge), color: COLORS.battery },
                    { label: "Grid import", value: kwh(d.grid), color: COLORS.grid },
                    ...(d.charge < 0 ? [{ label: "Battery charging", value: kwh(-d.charge), color: "rgba(52,211,153,0.45)" }] : []),
                    ...(d.cap !== null ? [{ label: "Grid cap", value: kwh(d.cap), color: COLORS.limit }] : []),
                  ]}
                />
              }
            />
            <Bar dataKey="solar" stackId="s" fill={COLORS.solar} {...anim} />
            <Bar dataKey="discharge" stackId="s" fill={COLORS.battery} {...anim} />
            <Bar dataKey="grid" stackId="s" fill={COLORS.grid} radius={[3, 3, 0, 0]} {...anim} />
            <Bar dataKey="charge" stackId="s" fill="rgba(52,211,153,0.45)" radius={[0, 0, 3, 3]} {...anim} />
            <Line dataKey="demand" type="linear" stroke={COLORS.demand} strokeWidth={1.5} dot={false} {...anim} />
            {hasCap && (
              <Line
                dataKey="cap"
                type="linear"
                stroke={COLORS.limit}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={{ r: 2.5, fill: COLORS.limit, strokeWidth: 0 }}
                connectNulls={false}
                {...anim}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
