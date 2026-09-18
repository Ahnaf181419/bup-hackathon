"use client";

import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Coins } from "lucide-react";
import { COLORS, SYNC_ID, axisProps, gridProps, hourTicks, cursorProps, ChartTooltip, Legend, useChartAnimation } from "./chartTheme";

/** Grid cost per hour (grid kWh x tariff) with the tariff on a second axis. Needs the input tariffs. */
export function CostBreakdownChart({ plan, hours = [] }) {
  const anim = useChartAnimation();
  const tariffByHour = new Map(hours.map((h) => [h.hour, h.tariff_bdt_per_kwh]));
  if (!plan || plan.length === 0 || tariffByHour.size !== 24) return null;

  const data = plan.map((p) => {
    const tariff = tariffByHour.get(p.hour);
    return { h: String(p.hour).padStart(2, "0"), cost: p.grid_kwh * tariff, tariff, grid: p.grid_kwh };
  });

  return (
    <section className="card" aria-labelledby="cost-title">
      <div className="card-header">
        <div>
          <h2 id="cost-title" className="card-title">
            <Coins size={18} strokeWidth={1.75} aria-hidden="true" />
            Hourly grid cost
          </h2>
          <p className="card-desc">Grid import times tariff. Cheap hours carry the load where limits allow.</p>
        </div>
        <Legend
          items={[
            { label: "Cost (BDT)", color: COLORS.grid },
            { label: "Tariff (BDT/kWh)", color: COLORS.demand },
          ]}
        />
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="h" {...axisProps} ticks={hourTicks} />
            <YAxis yAxisId="cost" {...axisProps} width={48} />
            <YAxis yAxisId="tariff" orientation="right" {...axisProps} width={32} />
            <Tooltip
              cursor={cursorProps}
              content={
                <ChartTooltip
                  rows={(d) => [
                    { label: "Cost", value: `${d.cost.toFixed(2)} BDT`, color: COLORS.grid },
                    { label: "Grid import", value: `${d.grid.toFixed(1)} kWh` },
                    { label: "Tariff", value: `${d.tariff} BDT/kWh`, color: COLORS.demand },
                  ]}
                />
              }
            />
            <Bar yAxisId="cost" dataKey="cost" fill={COLORS.grid} fillOpacity={0.85} radius={[3, 3, 0, 0]} {...anim} />
            <Line yAxisId="tariff" dataKey="tariff" type="stepAfter" stroke={COLORS.demand} strokeOpacity={0.7} strokeWidth={1.5} dot={false} {...anim} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
