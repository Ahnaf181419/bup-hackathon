"use client";

import React from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BatteryMedium } from "lucide-react";
import {
  COLORS,
  SYNC_ID,
  axisProps,
  gridProps,
  hourTicks,
  lineCursorProps,
  ChartTooltip,
  Legend,
  useChartAnimation,
  directiveSeries,
} from "./chartTheme";

/** Stored energy at the end of each hour, with every limit the plan had to respect drawn on the chart. */
export function BatteryStateChart({ plan, batteryConfig = {}, directives = [] }) {
  const anim = useChartAnimation();
  if (!plan || plan.length === 0) return null;

  const capacity = batteryConfig.capacity_kwh ?? null;
  const minimum = batteryConfig.minimum_energy_kwh ?? null;
  const initial = batteryConfig.initial_energy_kwh ?? null;
  const reserve = directiveSeries(directives, "minimum_battery_reserve", "minimum_energy_kwh", Math.max);
  const hasReserve = reserve.some((v) => v !== null);

  const data = plan.map((p) => ({
    h: String(p.hour).padStart(2, "0"),
    energy: p.battery_energy_after_kwh,
    action: p.battery_action,
    flow: p.battery_kwh,
    reserve: reserve[p.hour],
  }));

  const legend = [
    { label: "Stored energy", color: COLORS.battery },
    ...(capacity !== null ? [{ label: `Capacity ${capacity} kWh`, color: COLORS.axis, dashed: true }] : []),
    ...(minimum !== null ? [{ label: `Minimum ${minimum} kWh`, color: COLORS.limit, dashed: true }] : []),
    ...(hasReserve ? [{ label: "Reserve from notes", color: COLORS.reserve, dashed: true }] : []),
  ];

  return (
    <section className="card" aria-labelledby="battery-chart-title">
      <div className="card-header">
        <div>
          <h2 id="battery-chart-title" className="card-title">
            <BatteryMedium size={18} strokeWidth={1.75} aria-hidden="true" />
            Battery energy
          </h2>
          <p className="card-desc">
            At the end of each hour.{initial !== null ? ` Starts and must finish at ${initial} kWh.` : ""}
          </p>
        </div>
        <Legend items={legend} />
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="batteryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.battery} stopOpacity={0.28} />
                <stop offset="100%" stopColor={COLORS.battery} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="h" {...axisProps} ticks={hourTicks} />
            <YAxis {...axisProps} width={48} domain={[0, capacity !== null ? Math.ceil(capacity * 1.05) : "auto"]} />
            <Tooltip
              cursor={lineCursorProps}
              content={
                <ChartTooltip
                  rows={(d) => [
                    { label: "Stored energy", value: `${d.energy.toFixed(1)} kWh`, color: COLORS.battery },
                    { label: "Action", value: d.action === "idle" ? "Idle" : `${d.action === "charge" ? "Charge" : "Discharge"} ${d.flow.toFixed(1)} kWh` },
                    ...(d.reserve !== null ? [{ label: "Reserve required", value: `${d.reserve} kWh`, color: COLORS.reserve }] : []),
                  ]}
                />
              }
            />
            {capacity !== null && <ReferenceLine y={capacity} stroke={COLORS.axis} strokeDasharray="4 4" />}
            {minimum !== null && minimum > 0 && <ReferenceLine y={minimum} stroke={COLORS.limit} strokeDasharray="4 4" />}
            {initial !== null && <ReferenceLine y={initial} stroke="rgba(226,232,240,0.35)" strokeDasharray="2 4" />}
            <Area dataKey="energy" type="linear" stroke={COLORS.battery} strokeWidth={2} fill="url(#batteryFill)" dot={false} activeDot={{ r: 4 }} {...anim} />
            {hasReserve && (
              <Line
                dataKey="reserve"
                type="linear"
                stroke={COLORS.reserve}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={{ r: 2.5, fill: COLORS.reserve, strokeWidth: 0 }}
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
