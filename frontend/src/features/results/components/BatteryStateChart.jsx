"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export function BatteryStateChart({ plan, batteryConfig = {} }) {
  if (!plan || plan.length === 0) return null;

  const capacity = batteryConfig.capacity_kwh || 1000;
  const minimum = batteryConfig.minimum_energy_kwh || 150;
  const initial = batteryConfig.initial_energy_kwh || 400;

  const data = plan.map((p) => ({
    hour: `${String(p.hour).padStart(2, "0")}:00`,
    energy: p.battery_energy_after_kwh,
    action: p.battery_action,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0];
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
          <div style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
            Energy Level: {point.value?.toFixed(1)} kWh
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Action: {point.payload.action.toUpperCase()}
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
          <h3 className="pane-title">Battery Storage State of Charge (SoC) Trajectory</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Track battery reservoir over 24 hours respecting reserve floor and end-of-day neutrality
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem" }}>
          <span style={{ color: "var(--accent-amber)" }}>-- Min Reserve ({minimum} kWh)</span>
          <span style={{ color: "var(--accent-lime)" }}>-- Initial Target ({initial} kWh)</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} domain={[0, Math.ceil(capacity * 1.1)]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={capacity} stroke="#64748b" strokeDasharray="4 4" label={{ value: "Max Cap", fill: "#64748b", fontSize: 10 }} />
            <ReferenceLine y={minimum} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: "Min Reserve", fill: "#fbbf24", fontSize: 10 }} />
            <ReferenceLine y={initial} stroke="#a3e635" strokeDasharray="3 3" label={{ value: "Neutral Target", fill: "#a3e635", fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="energy"
              name="Battery Energy"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 3, fill: "#38bdf8" }}
              activeDot={{ r: 6, fill: "#a3e635" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
