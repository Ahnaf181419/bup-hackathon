"use client";

import React, { useState, useEffect } from "react";
import { FolderCheck, Sparkles, Database } from "lucide-react";
import { getSampleCases, getSampleCaseById } from "@/features/shared/lib/sampleCases";
import { api } from "@/features/shared/lib/api";

export function QuickTemplateSelector({ onSelectCase, activeCaseId }) {
  const localCases = getSampleCases();
  const [dbScenarios, setDbScenarios] = useState([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get("/api/scenarios")
      .then((res) => {
        if (mounted && res && Array.isArray(res.scenarios) && res.scenarios.length > 0) {
          setDbScenarios(res.scenarios);
          setIsDbLoaded(true);
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        background: "var(--bg-card-secondary)",
        padding: "10px 16px",
        borderRadius: "var(--radius-pill)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FolderCheck size={16} color="var(--accent-lime)" />
        <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Official Hackathon Benchmark Cases:
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "240px" }}>
        <select
          className="form-select"
          style={{
            flex: 1,
            padding: "6px 14px",
            fontSize: "0.825rem",
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
          }}
          value={activeCaseId || ""}
          onChange={handleSelect}
        >
          <option value="" disabled>
            Select a public sample case ({displayList.length} available)...
          </option>
          {displayList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}: {c.label} ({c.notesCount} notes)
            </option>
          ))}
        </select>
      </div>

      {isDbLoaded && (
        <span
          className="badge"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(182, 255, 62, 0.1)",
            color: "var(--accent-lime)",
            border: "1px solid rgba(182, 255, 62, 0.3)",
          }}
          title="Data populated directly from MongoDB database: bup_hackathon"
        >
          <Database size={11} />
          <span>MongoDB Atlas: bup_hackathon</span>
        </span>
      )}

      {activeCaseId && (
        <span
          className="badge badge-lime"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Sparkles size={12} />
          <span>Loaded: {activeCaseId}</span>
        </span>
      )}
    </div>
  );
}
