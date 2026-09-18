"use client";

import React from "react";
import { BatteryCharging, AlertTriangle } from "lucide-react";

const FIELDS = [
  { key: "capacity_kwh", label: "Capacity", unit: "kWh" },
  { key: "initial_energy_kwh", label: "Starting energy", unit: "kWh" },
  { key: "minimum_energy_kwh", label: "Minimum energy", unit: "kWh" },
  { key: "max_charge_kwh_per_hour", label: "Max charge", unit: "kWh/h" },
  { key: "max_discharge_kwh_per_hour", label: "Max discharge", unit: "kWh/h" },
];

export function BatteryConfigCard({ battery, onChange }) {
  const handleChange = (field, value) => {
    const num = parseFloat(value);
    onChange({ ...battery, [field]: Number.isNaN(num) ? 0 : Math.max(0, num) });
  };

  const cap = battery.capacity_kwh;
  const pct = (v) => (cap > 0 ? Math.min(100, Math.max(0, (v / cap) * 100)) : 0);
  const initialPct = pct(battery.initial_energy_kwh);
  const minPct = pct(battery.minimum_energy_kwh);

  const minAboveCap = battery.minimum_energy_kwh > cap;
  const initialOutOfRange = battery.initial_energy_kwh < battery.minimum_energy_kwh || battery.initial_energy_kwh > cap;

  return (
    <section className="card" aria-labelledby="battery-title">
      <div className="card-header">
        <div>
          <h2 id="battery-title" className="card-title">
            <BatteryCharging size={18} strokeWidth={1.75} aria-hidden="true" />
            Battery
          </h2>
          <p className="card-desc">The plan must end the day with the same energy it started with.</p>
        </div>
      </div>

      <div className="battery-meter" aria-hidden="true">
        <div className="meter" style={{ height: 8, position: "relative" }}>
          <span style={{ width: `${initialPct}%`, background: "var(--data-battery)" }} />
          <i className="battery-floor" style={{ left: `${minPct}%` }} />
        </div>
        <div className="row-between form-hint tabular">
          <span>
            Start {battery.initial_energy_kwh} kWh ({initialPct.toFixed(0)}%)
          </span>
          <span>Floor {battery.minimum_energy_kwh} kWh</span>
          <span>Capacity {cap} kWh</span>
        </div>
      </div>

      {(minAboveCap || initialOutOfRange) && (
        <div className="alert alert-error" role="alert">
          <AlertTriangle size={16} />
          <span>
            {minAboveCap
              ? "Minimum energy can't exceed capacity."
              : "Starting energy must be between the minimum energy and the capacity."}
          </span>
        </div>
      )}

      <div className="form-grid-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="form-group">
            <label htmlFor={`battery-${f.key}`} className="form-label">
              {f.label} <span className="muted">({f.unit})</span>
            </label>
            <input
              id={`battery-${f.key}`}
              type="number"
              min="0"
              inputMode="decimal"
              className="form-input tabular"
              value={battery[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              aria-invalid={
                (f.key === "initial_energy_kwh" && initialOutOfRange) || (f.key === "minimum_energy_kwh" && minAboveCap)
                  ? "true"
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
