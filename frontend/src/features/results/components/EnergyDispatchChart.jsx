"use client";

import React from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
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

/** Sequenced draw-in: the river fills source by source, then demand draws on top. */
const SEQ = { solar: 0, discharge: 140, grid: 280, charge: 420, demand: 620 };

/**
 * Hourly energy dispatch as an "energy river": the supply mix stacks as layered
 * gradient areas above zero, battery charging fills a hatched negative area below
 * zero, and demand rides over it as a stepped line with its peak labelled. Cap
 * windows show as a dashed red limit plus a soft over-cap band when constant.
 */
export function EnergyDispatchChart({ plan, hours = [], directives = [] }) {
  const anim = useChartAnimation();
  if (!plan || plan.length === 0) return null;

  const demandByHour = new Map(hours.map((h) => [h.hour, h.demand_kwh]));
  const gridCap = directiveSeries(directives, "max_grid_window", "max_grid_kwh", Math.min);
  const hasCap = gridCap.some((v) => v !== null);
  const capValues = gridCap.filter((v) => v !== null);
  const constCap = hasCap && capValues.every((v) => v === capValues[0]) ? capValues[0] : null;

  const data = plan.map((p) => ({
    h: String(p.hour).padStart(2, "0"),
    solar: p.solar_used_kwh || 0,
    discharge: p.battery_action === "discharge" ? p.battery_kwh : 0,
    grid: p.grid_kwh || 0,
    charge: p.battery_action === "charge" ? -p.battery_kwh : 0,
    demand: demandByHour.has(p.hour) ? demandByHour.get(p.hour) : null,
    cap: gridCap[p.hour],
  }));

  const hasCharge = data.some((d) => d.charge < 0);
  const hasDemand = data.some((d) => d.demand !== null);

  const stackMax = Math.max(...data.map((d) => d.solar + d.discharge + d.grid), ...(constCap !== null ? [constCap] : []));
  const yTop = Math.ceil(stackMax * 1.08);
  const chargeMin = hasCharge ? Math.floor(Math.min(...data.map((d) => d.charge)) * 1.2) : 0;

  const legend = [
    { label: "Solar used", color: COLORS.solar },
    { label: "Battery discharge", color: COLORS.battery },
    { label: "Grid import", color: COLORS.grid },
    ...(hasCharge ? [{ label: "Battery charging (hatched, below 0)", color: COLORS.battery, dashed: true }] : []),
    ...(hasCap ? [{ label: "Grid cap", color: COLORS.limit, dashed: true }] : []),
  ];

  const ariaText = `Stacked area chart of hourly energy dispatch. Supply from solar, battery discharge and grid import fills above zero; ${hasCharge ? "battery charging is hatched below zero; " : ""}${hasCap ? `grid import is capped${constCap !== null ? ` at ${constCap} kilowatt-hours` : ""}.` : "."}`;

  return (
    <section className="card" aria-labelledby="dispatch-title">
      <div className="card-header">
        <div>
          <h2 id="dispatch-title" className="card-title">
            <Activity size={18} strokeWidth={1.75} aria-hidden="true" />
            Hourly dispatch
          </h2>
          <p className="card-desc">Where each hour&apos;s energy comes from. The river above zero meets demand plus any battery charging hatched below.</p>
        </div>
        <Legend items={legend} />
      </div>

      <div style={{ width: "100%", height: 300 }} role="img" aria-label={ariaText}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="riverSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.solar} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLORS.solar} stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="riverBattery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.battery} stopOpacity={0.50} />
                <stop offset="100%" stopColor={COLORS.battery} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="riverGrid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.grid} stopOpacity={0.60} />
                <stop offset="100%" stopColor={COLORS.grid} stopOpacity={0.07} />
              </linearGradient>
              <pattern id="riverHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="rgba(52, 211, 153, 0.10)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(52, 211, 153, 0.55)" strokeWidth="1.4" />
              </pattern>
            </defs>

            <CartesianGrid {...gridProps} />
            <XAxis dataKey="h" {...axisProps} ticks={hourTicks} />
            <YAxis {...axisProps} width={48} domain={[chargeMin, yTop]} />

            {constCap !== null && (
              <ReferenceArea y1={constCap} y2={yTop} fill={COLORS.limit} fillOpacity={0.05} strokeOpacity={0} ifOverflow="extendDomain" />
            )}

            <Tooltip
              cursor={cursorProps}
              content={
                <ChartTooltip
                  rows={(d) => [
                    ...(d.demand !== null ? [{ label: "Demand", value: kwh(d.demand), color: COLORS.demand }] : []),
                    { label: "Solar used", value: kwh(d.solar), color: COLORS.solar },
                    { label: "Battery discharge", value: kwh(d.discharge), color: COLORS.battery },
                    { label: "Grid import", value: kwh(d.grid), color: COLORS.grid },
                    ...(d.charge < 0 ? [{ label: "Battery charging", value: kwh(-d.charge), color: COLORS.battery }] : []),
                    ...(d.cap !== null ? [{ label: "Grid cap", value: kwh(d.cap), color: COLORS.limit }] : []),
                  ]}
                />
              }
            />

            <ReferenceLine y={0} stroke="rgba(255,255,255,0.28)" />

            <Area dataKey="solar" stackId="river" type="monotone" stroke={COLORS.solar} strokeWidth={1.25} fill="url(#riverSolar)" {...anim} animationBegin={SEQ.solar} />
            <Area dataKey="discharge" stackId="river" type="monotone" stroke={COLORS.battery} strokeWidth={1.25} fill="url(#riverBattery)" {...anim} animationBegin={SEQ.discharge} />
            <Area dataKey="grid" stackId="river" type="monotone" stroke={COLORS.grid} strokeWidth={1.5} fill="url(#riverGrid)" {...anim} animationBegin={SEQ.grid} />
            {hasCharge && (
              <Area
                dataKey="charge"
                stackId="river"
                type="monotone"
                stroke="rgba(52, 211, 153, 0.55)"
                strokeWidth={1}
                strokeDasharray="1 0"
                fill="url(#riverHatch)"
                {...anim}
                animationBegin={SEQ.charge}
              />
            )}

            {hasCap && (
              <Line
                dataKey="cap"
                type="stepAfter"
                stroke={COLORS.limit}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={{ r: 2.5, fill: COLORS.limit, strokeWidth: 0 }}
                connectNulls={false}
                activeDot={{ r: 4, fill: COLORS.limit, stroke: "#070b10", strokeWidth: 1.5 }}
                {...anim}
                animationBegin={SEQ.charge}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
