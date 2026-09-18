"use client";

import React from "react";
import { Zap, Play, RotateCcw, AlertTriangle, Layers } from "lucide-react";
import { useOptimize } from "../hooks/useOptimize";
import { HourlyDataTable } from "./HourlyDataTable";
import { BatteryConfigCard } from "./BatteryConfigCard";
import { OperatorNotesInput } from "./OperatorNotesInput";
import { QuickTemplateSelector } from "./QuickTemplateSelector";
import { OptimizationProgressModal } from "./OptimizationProgressModal";

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
    currentStep,
    error,
    runOptimization,
  } = useOptimize();

  const totalDemand = hours.reduce((acc, h) => acc + (h.demand_kwh || 0), 0);
  const totalSolar = hours.reduce((acc, h) => acc + (h.solar_kwh || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Progress Modal */}
      <OptimizationProgressModal isOpen={isOptimizing} currentStep={currentStep} />

      {/* Header Row */}
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">
            <span>⚡ Scenario Optimizer</span>
            <span className="badge badge-lime">LLM + LP Simplex</span>
          </h1>
          <p className="page-subtitle">
            Configure 24-hour campus load, rooftop solar generation, battery storage parameters, and natural language operator directives.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={runOptimization}
            className="btn-primary"
            disabled={isOptimizing}
            style={{ padding: "12px 28px", fontSize: "0.95rem" }}
          >
            <Play size={18} fill="#070e02" />
            <span>Optimize 24h Schedule</span>
          </button>
        </div>
      </div>

      {/* Quick Benchmark Preset Selector */}
      <QuickTemplateSelector onSelectCase={loadCase} activeCaseId={activeCaseId} />

      {/* Error alert if any */}
      {error && (
        <div
          style={{
            padding: "12px 18px",
            background: "var(--accent-rose-subtle)",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--accent-rose)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Split Grid Layout — Matching Reference Bottom Half */}
      <div className="dashboard-split-layout">
        {/* Left Column: Directives, Battery, & Scenario Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Scenario Meta Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Scenario Identification</h3>
              </div>
              <span className="badge badge-gray">24-Hour Horizon</span>
            </div>

            <div className="form-group">
              <label className="form-label">Scenario ID / Case Identifier</label>
              <input
                type="text"
                className="form-input"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                placeholder="e.g. SAMPLE-01, BUP-CAMPUS-PEAK-DAY"
              />
            </div>
          </div>

          {/* Operator Directives & LLM Notes */}
          <OperatorNotesInput notes={operatorNotes} onChange={setOperatorNotes} />

          {/* Battery Storage Config */}
          <BatteryConfigCard battery={battery} onChange={setBattery} />
        </div>

        {/* Right Column: 24-Hour Demand, Solar & Tariff Schedule */}
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
              <Zap size={20} color="var(--accent-lime)" />
              <h3 className="pane-title">24-Hour Grid & Solar Matrix</h3>
            </div>
            <span className="badge badge-lime">24 Hourly Intervals (0–23)</span>
          </div>

          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Hourly campus electricity demand, expected solar photovoltaic output, and time-of-use tariff rate.
          </p>

          <HourlyDataTable hours={hours} onChange={setHours} />
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div
        style={{
          position: "sticky",
          bottom: "16px",
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-pill)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-lg)",
          zIndex: 50,
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "0.85rem" }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Scenario: </span>
            <strong style={{ color: "var(--text-primary)" }}>{scenarioId}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Campus Demand: </span>
            <strong style={{ color: "var(--accent-cyan)" }}>{totalDemand.toFixed(1)} kWh</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Solar Forecast: </span>
            <strong style={{ color: "var(--accent-lime)" }}>{totalSolar.toFixed(1)} kWh</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Battery Capacity: </span>
            <strong style={{ color: "var(--accent-amber)" }}>{battery.capacity_kwh} kWh</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Directives: </span>
            <strong style={{ color: "var(--text-primary)" }}>{operatorNotes.length} notes</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={runOptimization}
          className="btn-primary"
          disabled={isOptimizing}
          style={{ height: "42px", padding: "0 26px" }}
        >
          <Zap size={18} fill="#070e02" />
          <span>Execute Optimization Pipeline</span>
        </button>
      </div>
    </div>
  );
}
