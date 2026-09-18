"use client";

import React, { useId } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useChartAnimation } from "@/features/results/components/chartTheme";

/** Tiny trend line for a KPI card. Decorative: the exact numbers live in the card and charts. */
export function KpiSpark({ points = [], color = "var(--accent-cyan)" }) {
  const anim = useChartAnimation();
  const gradId = useId();
  if (points.length < 2) return null;

  const data = points.map((v, i) => ({ i, v }));

  return (
    <div className="kpi-spark" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey="v"
            type="monotone"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={anim.isAnimationActive}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
