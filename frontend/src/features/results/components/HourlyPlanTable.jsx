"use client";

import React, { useState } from "react";
import { Copy, Check, Table2, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatHour } from "@/features/shared/lib/format";

const ACTIONS = {
  charge: { label: "Charge", icon: ArrowDown, color: "var(--data-battery)" },
  discharge: { label: "Discharge", icon: ArrowUp, color: "var(--data-grid)" },
  idle: { label: "Idle", icon: Minus, color: "var(--text-muted)" },
};

export function HourlyPlanTable({ plan, batteryCapacity }) {
  const [copied, setCopied] = useState(false);
  if (!plan || plan.length === 0) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="card" aria-labelledby="plan-table-title">
      <div className="card-header">
        <div>
          <h2 id="plan-table-title" className="card-title">
            <Table2 size={18} strokeWidth={1.75} aria-hidden="true" />
            Hourly plan
          </h2>
          <p className="card-desc">The exact values returned by the API, in kWh.</p>
        </div>
        <button type="button" onClick={handleCopy} className="btn-secondary btn-sm" aria-live="polite">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied" : "Copy as JSON"}</span>
        </button>
      </div>

      <div className="data-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th scope="col">Hour</th>
              <th scope="col" className="num">
                <span className="th-inner">
                  <i className="swatch" style={{ background: "var(--data-grid)" }} aria-hidden="true" />
                  Grid import
                </span>
              </th>
              <th scope="col" className="num">
                <span className="th-inner">
                  <i className="swatch" style={{ background: "var(--data-solar)" }} aria-hidden="true" />
                  Solar used
                </span>
              </th>
              <th scope="col">Battery</th>
              <th scope="col" className="num">Battery kWh</th>
              <th scope="col">Stored at end of hour</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((row) => {
              const action = ACTIONS[(row.battery_action || "idle").toLowerCase()] || ACTIONS.idle;
              const Icon = action.icon;
              const pct =
                batteryCapacity > 0 ? Math.min(100, Math.max(0, (row.battery_energy_after_kwh / batteryCapacity) * 100)) : null;
              return (
                <tr key={row.hour}>
                  <td className="cell-hour">{formatHour(row.hour)}</td>
                  <td className={`num ${row.grid_kwh > 0 ? "" : "cell-zero"}`}>{row.grid_kwh.toFixed(2)}</td>
                  <td className={`num ${row.solar_used_kwh > 0 ? "" : "cell-zero"}`}>{row.solar_used_kwh.toFixed(2)}</td>
                  <td>
                    <span className="action-cell" style={{ color: action.color }}>
                      <Icon size={13} strokeWidth={2} aria-hidden="true" />
                      {action.label}
                    </span>
                  </td>
                  <td className={`num ${row.battery_kwh > 0 ? "" : "cell-zero"}`}>{row.battery_kwh.toFixed(2)}</td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="tabular" style={{ minWidth: 56 }}>
                        {row.battery_energy_after_kwh.toFixed(1)}
                      </span>
                      {pct !== null && (
                        <>
                          <div className="meter" style={{ width: 80 }}>
                            <span style={{ width: `${pct}%`, background: "var(--data-battery)" }} />
                          </div>
                          <span className="muted tabular" style={{ fontSize: "var(--text-xs)" }}>
                            {pct.toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
