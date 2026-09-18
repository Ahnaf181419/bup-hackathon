"use client";

import React from "react";
import { Play, AlertTriangle, Table2 } from "lucide-react";
import { useOptimize } from "../hooks/useOptimize";
import { HourlyDataTable } from "./HourlyDataTable";
import { BatteryConfigCard } from "./BatteryConfigCard";
import { OperatorNotesInput } from "./OperatorNotesInput";
import { QuickTemplateSelector } from "./QuickTemplateSelector";
import { OptimizationProgressModal } from "./OptimizationProgressModal";
import { formatKwh } from "@/features/shared/lib/format";

export function ScenarioForm() {
  const {
    scenarioId,
    setScenarioId,
    operatorNotes,
    setOperatorNotes,
    hours,
    setHours,
    battery,
    setBattery,
    activeCaseId,
    loadCase,
    isOptimizing,
    run,
    closeRun,
    openResult,
    error,
    runOptimization,
  } = useOptimize();

  const totalDemand = hours.reduce((acc, h) => acc + (h.demand_kwh || 0), 0);
  const totalSolar = hours.reduce((acc, h) => acc + (h.solar_kwh || 0), 0);

  return (
    <div className="stack">
      <OptimizationProgressModal run={run} notes={operatorNotes} onClose={closeRun} onOpenResult={openResult} />

      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">Optimize a scenario</h1>
          <p className="page-subtitle">
            Enter the day&apos;s demand, solar forecast, tariffs and battery limits, plus up to three operator notes.
            EnergiQ interprets the notes and returns the least-cost 24-hour plan.
          </p>
        </div>
        <div className="header-actions">
          <QuickTemplateSelector onSelectCase={loadCase} activeCaseId={activeCaseId} />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="dashboard-split-layout">
        <div className="stack">
          <section className="card" aria-labelledby="scenario-id-label">
            <div className="form-group">
              <label id="scenario-id-label" htmlFor="scenario-id" className="form-label">
                Scenario ID
              </label>
              <input
                id="scenario-id"
                type="text"
                className="form-input"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                placeholder="e.g. CAMPUS-PEAK-DAY"
                aria-invalid={!scenarioId.trim() ? "true" : undefined}
              />
            </div>
          </section>

          <OperatorNotesInput notes={operatorNotes} onChange={setOperatorNotes} />
          <BatteryConfigCard battery={battery} onChange={setBattery} />
        </div>

        <section className="card" aria-labelledby="hourly-title">
          <div className="card-header">
            <div>
              <h2 id="hourly-title" className="card-title">
                <Table2 size={18} strokeWidth={1.75} aria-hidden="true" />
                Hourly inputs
              </h2>
              <p className="card-desc">Demand, forecast solar and tariff for each hour, 00:00 to 23:00.</p>
            </div>
          </div>
          <HourlyDataTable hours={hours} onChange={setHours} />
        </section>
      </div>

      <div className="action-bar">
        <div className="action-bar-stats">
          <span>
            Demand <strong>{formatKwh(totalDemand)} kWh</strong>
          </span>
          <span>
            Solar <strong>{formatKwh(totalSolar)} kWh</strong>
          </span>
          <span>
            Battery <strong>{battery.capacity_kwh} kWh</strong>
          </span>
          <span>
            Notes <strong>{operatorNotes.filter((n) => n.trim()).length}</strong>
          </span>
        </div>
        <button type="button" onClick={runOptimization} className="btn-primary btn-lg" disabled={isOptimizing}>
          <Play size={16} fill="currentColor" />
          <span>{isOptimizing ? "Running…" : "Run optimization"}</span>
        </button>
      </div>
    </div>
  );
}
