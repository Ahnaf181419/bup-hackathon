"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function EnergyDispatchChart({ plan }) {
  if (!plan || plan.length === 0) return null;

  const data = plan.map((p) => ({
    hour: `${String(p.hour).padStart(2, "0")}:00`,
    solar: p.solar_used_kwh || 0,
    grid: p.grid_kwh || 0,
    batteryDischarge: p.battery_action === "discharge" ? p.battery_kwh : 0,
    batteryCharge: p.battery_action === "charge" ? p.battery_kwh : 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>
            Hour {label}
          </div>
          {payload.map((entry, index) => (
            <div
              key={`item-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                color: entry.color,
                margin: "3px 0",
              }}
            >
              <span>{entry.name}:</span>
              <strong>{entry.value.toFixed(1)} kWh</strong>
            </div>
          ))}
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
          <h3 className="pane-title">24-Hour Energy Generation & Dispatch Flow</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Stacked contribution of Rooftop Solar, Grid Import, and Battery Storage discharge
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a3e635" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a3e635" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="batteryDischargeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "0.8rem", paddingTop: "10px" }}
              formatter={(val) => <span style={{ color: "var(--text-secondary)" }}>{val}</span>}
            />
            <Area
              type="monotone"
              dataKey="solar"
              name="Solar Utilized"
              stroke="#a3e635"
              fillOpacity={1}
              fill="url(#solarGradient)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="batteryDischarge"
              name="Battery Discharge"
              stroke="#fbbf24"
              fillOpacity={1}
              fill="url(#batteryDischargeGradient)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="grid"
              name="Utility Grid Draw"
              stroke="#38bdf8"
              fillOpacity={1}
              fill="url(#gridGradient)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
