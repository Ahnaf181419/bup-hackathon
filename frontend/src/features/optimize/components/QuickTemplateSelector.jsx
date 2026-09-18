"use client";

import React, { useState, useEffect } from "react";
import { getSampleCases, getSampleCaseById } from "@/features/shared/lib/sampleCases";
import { api } from "@/features/shared/lib/api";

export function QuickTemplateSelector({ onSelectCase, activeCaseId }) {
  const localCases = getSampleCases();
  const [dbScenarios, setDbScenarios] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.get("/api/scenarios")
      .then((res) => {
        if (mounted && res && Array.isArray(res.scenarios) && res.scenarios.length > 0) {
          setDbScenarios(res.scenarios);
        }
      })
      .catch(() => {
        // graceful offline fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    // Check DB scenarios first
    const matchedDb = dbScenarios.find((s) => s.scenarioId === selectedId);
    if (matchedDb) {
      onSelectCase({
        id: matchedDb.scenarioId,
        label: matchedDb.label,
        description: matchedDb.description,
        input: {
          scenario_id: matchedDb.scenarioId,
          operator_notes: matchedDb.operatorNotes,
          hours: matchedDb.hours.map((h) => ({
            hour: h.hour,
            demand_kwh: h.demandKwh ?? h.demand_kwh,
            solar_kwh: h.solarKwh ?? h.solar_kwh,
            tariff_bdt_per_kwh: h.tariffBdtPerKwh ?? h.tariff_bdt_per_kwh,
          })),
          battery: {
            capacity_kwh: matchedDb.battery.capacityKwh ?? matchedDb.battery.capacity_kwh,
            initial_energy_kwh: matchedDb.battery.initialEnergyKwh ?? matchedDb.battery.initial_energy_kwh,
            minimum_energy_kwh: matchedDb.battery.minimumEnergyKwh ?? matchedDb.battery.minimum_energy_kwh,
            max_charge_kwh_per_hour: matchedDb.battery.maxChargeKwhPerHour ?? matchedDb.battery.max_charge_kwh_per_hour,
            max_discharge_kwh_per_hour: matchedDb.battery.maxDischargeKwhPerHour ?? matchedDb.battery.max_discharge_kwh_per_hour,
          },
        },
      });
      return;
    }

    // Fallback to local
    const fullCase = getSampleCaseById(selectedId);
    if (fullCase) {
      onSelectCase(fullCase);
    }
  };

  const displayList = dbScenarios.length > 0
    ? dbScenarios.map((s) => ({
        id: s.scenarioId,
        label: s.label || s.scenarioId,
        notesCount: s.operatorNotes?.length || 0,
      }))
    : localCases;

  return (
    <div className="sample-picker">
      <label htmlFor="sample-case" className="form-label">
        Load a public sample
      </label>
      <select id="sample-case" className="form-select" value={activeCaseId || ""} onChange={handleSelect}>
        <option value="" disabled>
          Choose one of {displayList.length} cases
        </option>
        {displayList.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id}: {c.label} ({c.notesCount} {c.notesCount === 1 ? "note" : "notes"})
          </option>
        ))}
      </select>
    </div>
  );
}
