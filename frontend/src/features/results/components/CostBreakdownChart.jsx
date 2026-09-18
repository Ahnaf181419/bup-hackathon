"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function CostBreakdownChart({ plan, hours = [] }) {
  if (!plan || plan.length === 0) return null;

  const data = plan.map((p, idx) => {
    const tariff = hours[idx]?.tariff_bdt_per_kwh || (p.hour >= 17 && p.hour <= 22 ? 12 : 6);
    const cost = p.grid_kwh * tariff;
    return {
      hour: `${String(p.hour).padStart(2, "0")}:00`,
      cost: Number(cost.toFixed(2)),
      tariff,
      grid: p.grid_kwh,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div
          style={{
            background: "#0c1219",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            boxShadow: "var(--shadow-lg)",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)" }}>
            Hour {label}
          </div>
          <div style={{ color: "var(--accent-lime)", fontWeight: 800 }}>
            Cost: {p.cost.toFixed(2)} BDT
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Grid Draw: {p.grid.toFixed(1)} kWh @ {p.tariff} BDT/kWh
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div className="pane-header-row">
        <div>
          <h3 className="pane-title">Hourly Campus Electricity Cost Profile</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Grid draw expenditure per hour based on dynamic tariff pricing (BDT)
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" name="Hourly Cost (BDT)" fill="#a3e635" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
