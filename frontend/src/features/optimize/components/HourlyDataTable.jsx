"use client";

import React from "react";
import { formatHour, formatKwh } from "@/features/shared/lib/format";

const COLUMNS = [
  { key: "demand_kwh", label: "Demand (kWh)", step: "1", swatch: "var(--data-demand)" },
  { key: "solar_kwh", label: "Solar forecast (kWh)", step: "1", swatch: "var(--data-solar)" },
  { key: "tariff_bdt_per_kwh", label: "Tariff (BDT/kWh)", step: "0.5", swatch: null },
];

export function HourlyDataTable({ hours, onChange }) {
  const handleCellChange = (hourIndex, field, value) => {
    const num = parseFloat(value);
    const updated = [...hours];
    updated[hourIndex] = { ...updated[hourIndex], [field]: Number.isNaN(num) ? 0 : Math.max(0, num) };
    onChange(updated);
  };

  const tariffs = hours.map((h) => h.tariff_bdt_per_kwh || 0);
  const minTariff = Math.min(...tariffs);
  const maxTariff = Math.max(...tariffs);

  return (
    <div className="data-table-container" style={{ maxHeight: 640, overflowY: "auto" }}>
      <table className="custom-table">
        <thead>
          <tr>
            <th scope="col">Hour</th>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col">
                <span className="th-inner">
                  {c.swatch && <i className="swatch" style={{ background: c.swatch }} aria-hidden="true" />}
                  {c.label}
                </span>
              </th>
            ))}
            <th scope="col">Net need after solar</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((row, idx) => {
            const net = Math.max(0, row.demand_kwh - row.solar_kwh);
            const solarShare = row.demand_kwh > 0 ? Math.min(1, row.solar_kwh / row.demand_kwh) : 0;
            const isPeakTariff = maxTariff > minTariff && row.tariff_bdt_per_kwh === maxTariff;
            return (
              <tr key={row.hour}>
                <td className="cell-hour">{formatHour(row.hour)}</td>
                {COLUMNS.map((c) => (
                  <td key={c.key}>
                    <input
                      type="number"
                      min="0"
                      step={c.step}
                      inputMode="decimal"
                      className="table-input-cell"
                      value={row[c.key]}
                      onChange={(e) => handleCellChange(idx, c.key, e.target.value)}
                      aria-label={`${c.label} at ${formatHour(row.hour)}`}
                    />
                    {c.key === "tariff_bdt_per_kwh" && isPeakTariff && <span className="peak-tag">peak</span>}
                  </td>
                ))}
                <td style={{ minWidth: 150 }}>
                  <div className="meter" title={`Solar covers ${(solarShare * 100).toFixed(0)}% of demand`}>
                    <span style={{ width: `${solarShare * 100}%`, background: "var(--data-solar)" }} />
                  </div>
                  <span className="form-hint tabular" style={{ display: "block", marginTop: 4 }}>
                    {net > 0 ? `${formatKwh(net, 0)} kWh from grid or battery` : "Covered by solar"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
