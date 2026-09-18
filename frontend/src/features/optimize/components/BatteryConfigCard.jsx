"use client";

import React from "react";
import { BatteryCharging, ShieldAlert, Zap, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export function BatteryConfigCard({ battery, onChange }) {
  const handleChange = (field, value) => {
    const num = parseFloat(value);
    onChange({
      ...battery,
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    });
  };

  const initialRatio = battery.capacity_kwh > 0 ? (battery.initial_energy_kwh / battery.capacity_kwh) * 100 : 0;
  const minRatio = battery.capacity_kwh > 0 ? (battery.minimum_energy_kwh / battery.capacity_kwh) * 100 : 0;

  const isInitialValid =
    battery.initial_energy_kwh >= battery.minimum_energy_kwh &&
    battery.initial_energy_kwh <= battery.capacity_kwh;

  return (
    <div
      style={{
        background: "var(--bg-card-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BatteryCharging size={20} color="var(--accent-lime)" />
          <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Battery Storage Subsystem</h4>
        </div>
        <span className="badge badge-lime">End-of-Day Neutral</span>
      </div>

      {/* Visual Battery Reservoir Indicator */}
      <div
        style={{
          background: "#080d13",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Initial SoC: <strong style={{ color: "var(--text-primary)" }}>{battery.initial_energy_kwh} kWh</strong> ({initialRatio.toFixed(0)}%)
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            Min Reserve: <strong style={{ color: "var(--accent-amber)" }}>{battery.minimum_energy_kwh} kWh</strong> ({minRatio.toFixed(0)}%)
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            Max Cap: <strong style={{ color: "var(--accent-lime)" }}>{battery.capacity_kwh} kWh</strong>
          </span>
        </div>

        {/* Multi-layered visual battery meter */}
        <div
          style={{
            height: "10px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "var(--radius-pill)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Minimum Reserve Zone */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.min(100, minRatio)}%`,
              background: "rgba(251, 191, 36, 0.3)",
              borderRight: "2px solid var(--accent-amber)",
            }}
            title="Minimum Reserve Energy Floor"
          />
          {/* Active Initial Energy Level */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.min(100, initialRatio)}%`,
              background: "var(--accent-lime)",
              opacity: 0.85,
            }}
            title="Initial Starting Energy"
          />
        </div>
      </div>

      {!isInitialValid && (
        <div
          style={{
            padding: "8px 12px",
            background: "var(--accent-rose-subtle)",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "var(--accent-rose)",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ShieldAlert size={14} />
          <span>Initial energy must be between minimum reserve and total capacity.</span>
        </div>
      )}

      {/* Grid of 5 Parameter Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.775rem" }}>
            Total Capacity (kWh)
          </label>
          <input
            type="number"
            min="10"
            className="form-input"
            value={battery.capacity_kwh}
            onChange={(e) => handleChange("capacity_kwh", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.775rem" }}>
            Initial Energy (kWh)
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={battery.initial_energy_kwh}
            onChange={(e) => handleChange("initial_energy_kwh", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.775rem" }}>
            Minimum Reserve (kWh)
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={battery.minimum_energy_kwh}
            onChange={(e) => handleChange("minimum_energy_kwh", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.775rem" }}>
            Max Charge Rate (kWh/h)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min="0"
              className="form-input"
              style={{ width: "100%" }}
              value={battery.max_charge_kwh_per_hour}
              onChange={(e) => handleChange("max_charge_kwh_per_hour", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: "span 2" }}>
          <label className="form-label" style={{ fontSize: "0.775rem" }}>
            Max Discharge Rate (kWh/h)
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={battery.max_discharge_kwh_per_hour}
            onChange={(e) => handleChange("max_discharge_kwh_per_hour", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
