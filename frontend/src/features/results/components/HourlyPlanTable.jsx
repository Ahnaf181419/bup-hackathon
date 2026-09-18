"use client";

import React, { useState } from "react";
import { Download, Check, Sun, Zap, BatteryCharging, ArrowDownRight, ArrowUpRight } from "lucide-react";

export function HourlyPlanTable({ plan, batteryCapacity = 1000 }) {
  const [copied, setCopied] = useState(false);

  if (!plan || plan.length === 0) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadge = (action) => {
    switch ((action || "idle").toLowerCase()) {
      case "charge":
        return (
          <span className="badge badge-lime" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
            <ArrowDownRight size={12} />
            <span>CHARGE</span>
          </span>
        );
      case "discharge":
        return (
          <span className="badge badge-cyan" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
            <ArrowUpRight size={12} />
            <span>DISCHARGE</span>
          </span>
        );
      default:
        return <span className="badge badge-gray">IDLE</span>;
    }
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
        gap: "18px",
      }}
    >
      <div className="pane-header-row">
        <div className="pane-title-group">
          <BatteryCharging size={20} color="var(--accent-lime)" />
          <h3 className="pane-title">Optimal 24-Hour Dispatch Plan</h3>
        </div>

        <button
          type="button"
          onClick={handleCopyJSON}
          className="btn-secondary"
          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
        >
          {copied ? <Check size={14} color="var(--accent-lime)" /> : <Download size={14} />}
          <span>{copied ? "JSON Copied!" : "Export Hourly Schedule"}</span>
        </button>
      </div>

      <div className="data-table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
        <table className="custom-table">
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: "80px" }}>Hour</th>
              <th>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap size={13} color="var(--accent-cyan)" />
                  <span>Grid Import (kWh)</span>
                </div>
              </th>
              <th>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sun size={13} color="var(--accent-lime)" />
                  <span>Solar Used (kWh)</span>
                </div>
              </th>
              <th>Battery Action</th>
              <th>Battery Flow (kWh)</th>
              <th>Ending Battery SoC (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((row) => {
              const formattedHour = `${String(row.hour).padStart(2, "0")}:00`;
              const socPercent = Math.min(100, Math.max(0, (row.battery_energy_after_kwh / batteryCapacity) * 100));

              return (
                <tr key={row.hour}>
                  <td style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                    {formattedHour}
                  </td>
                  <td style={{ fontWeight: 700, color: row.grid_kwh > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {row.grid_kwh.toFixed(2)}
                  </td>
                  <td style={{ color: row.solar_used_kwh > 0 ? "var(--accent-lime)" : "var(--text-muted)", fontWeight: 600 }}>
                    {row.solar_used_kwh.toFixed(2)}
                  </td>
                  <td>{getActionBadge(row.battery_action)}</td>
                  <td style={{ fontWeight: 600 }}>
                    {row.battery_kwh > 0 ? `${row.battery_kwh.toFixed(2)} kWh` : "0.00"}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "65px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {row.battery_energy_after_kwh.toFixed(1)}
                      </span>
                      <div
                        style={{
                          width: "80px",
                          height: "6px",
                          background: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "var(--radius-pill)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${socPercent}%`,
                            background: "var(--accent-cyan)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {socPercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
