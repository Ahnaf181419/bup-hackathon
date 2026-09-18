"use client";

import React from "react";
import { Sun, Zap, Coins } from "lucide-react";

export function HourlyDataTable({ hours, onChange }) {
  const handleCellChange = (hourIndex, field, value) => {
    const num = parseFloat(value);
    const updated = [...hours];
    updated[hourIndex] = {
      ...updated[hourIndex],
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    };
    onChange(updated);
  };

  const totals = hours.reduce(
    (acc, h) => ({
      demand: acc.demand + (h.demand_kwh || 0),
      solar: acc.solar + (h.solar_kwh || 0),
      avgTariff: acc.avgTariff + (h.tariff_bdt_per_kwh || 0) / 24,
    }),
    { demand: 0, solar: 0, avgTariff: 0 }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.825rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Total Demand: <strong style={{ color: "var(--text-primary)" }}>{totals.demand.toFixed(1)} kWh</strong>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            Total Solar: <strong style={{ color: "var(--accent-lime)" }}>{totals.solar.toFixed(1)} kWh</strong>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            Avg Tariff: <strong style={{ color: "var(--accent-amber)" }}>{totals.avgTariff.toFixed(2)} BDT</strong>
          </span>
        </div>
      </div>

      <div className="data-table-container" style={{ maxHeight: "420px", overflowY: "auto" }}>
        <table className="custom-table">
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: "80px" }}>Hour</th>
              <th>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap size={13} color="var(--accent-cyan)" />
                  <span>Demand (kWh)</span>
                </div>
              </th>
              <th>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sun size={13} color="var(--accent-lime)" />
                  <span>Forecast Solar (kWh)</span>
                </div>
              </th>
              <th>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Coins size={13} color="var(--accent-amber)" />
                  <span>Tariff (BDT/kWh)</span>
                </div>
              </th>
              <th style={{ width: "160px" }}>Energy Mix Preview</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((row, idx) => {
              const netDeficit = Math.max(0, row.demand_kwh - row.solar_kwh);
              const solarRatio = row.demand_kwh > 0 ? Math.min(1, row.solar_kwh / row.demand_kwh) : 0;
              const formattedHour = `${String(row.hour).padStart(2, "0")}:00`;

              return (
                <tr key={row.hour}>
                  <td style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                    {formattedHour}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="table-input-cell"
                      value={row.demand_kwh}
                      onChange={(e) => handleCellChange(idx, "demand_kwh", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="table-input-cell"
                      style={{ color: "var(--accent-lime)" }}
                      value={row.solar_kwh}
                      onChange={(e) => handleCellChange(idx, "solar_kwh", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="table-input-cell"
                      style={{ color: "var(--accent-amber)" }}
                      value={row.tariff_bdt_per_kwh}
                      onChange={(e) => handleCellChange(idx, "tariff_bdt_per_kwh", e.target.value)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div
                        style={{
                          height: "6px",
                          width: "100%",
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: "var(--radius-pill)",
                          overflow: "hidden",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: `${solarRatio * 100}%`,
                            background: "var(--accent-lime)",
                          }}
                          title={`Solar: ${row.solar_kwh} kWh`}
                        />
                        <div
                          style={{
                            width: `${(1 - solarRatio) * 100}%`,
                            background: "var(--accent-cyan)",
                          }}
                          title={`Grid/Battery Need: ${netDeficit.toFixed(1)} kWh`}
                        />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {netDeficit > 0 ? `${netDeficit.toFixed(0)} kWh deficit` : "100% solar covered"}
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
