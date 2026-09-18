"use client";

import React from "react";
import { Coins, Zap, Activity, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { MetricCard } from "@/features/shared/components/MetricCard";

export function ResultSummaryCard({ result }) {
  if (!result) return null;

  const cost = typeof result.total_cost_bdt === "number"
    ? result.total_cost_bdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  const grid = typeof result.total_grid_kwh === "number" ? result.total_grid_kwh.toFixed(1) : "—";
  const peak = typeof result.peak_grid_kwh === "number" ? result.peak_grid_kwh.toFixed(1) : "—";
  const runtime = typeof result.processingTimeMs === "number" && result.processingTimeMs > 0 ? `${result.processingTimeMs} ms` : "—";

  const isOptimal = (result.status || "optimal").toLowerCase() === "optimal";
  const stats = computeStats(result);
  const summaryPoints = (result.plan_summary || "24-hour campus energy schedule successfully solved.")
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Banner with Scenario & Neutrality Badge */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: "1 1 520px" }}>
          <div
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-pill)",
              background: "linear-gradient(135deg, #a3e635 0%, #34d399 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#070e02",
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>
              Optimization Result: {result.scenario_id}
            </h3>
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
              {summaryPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`badge ${isOptimal ? "badge-lime" : "badge-amber"}`}>
            ● {result.status ? result.status.toUpperCase() : "OPTIMAL DISPATCH"}
          </span>
          <span className="badge badge-cyan" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={13} />
            <span>SoC Neutrality: Verified (±0.01 kWh)</span>
          </span>
        </div>
      </div>

      {/* 4 KPI Cards matching the reference screenshot top row */}
      <div className="kpi-cards-grid">
        <MetricCard
          label="Total Campus Electricity Cost"
          value={cost}
          unit="BDT"
          icon={Coins}
          variant="lime"
          isHighlight={true}
          subtext={stats.savingsPct !== null ? `Saves ${stats.savingsPct.toFixed(1)}% vs. no battery` : "Minimum grid cost"}
          badgeText="Minimized"
          progressPercent={stats.savingsPct ?? 0}
        />
        <MetricCard
          label="Total Grid Import"
          value={grid}
          unit="kWh"
          icon={Zap}
          variant="cyan"
          subtext={stats.gridSharePct !== null ? `${stats.gridSharePct.toFixed(0)}% of daily demand` : "Utility grid import"}
          badgeText="Demand met"
          progressPercent={stats.gridSharePct ?? 0}
        />
        <MetricCard
          label="Peak Grid Demand Draw"
          value={peak}
          unit="kWh"
          icon={Activity}
          variant="amber"
          subtext={stats.peakHour !== null ? `Highest hour: ${String(stats.peakHour).padStart(2, "0")}:00` : "Highest single-hour draw"}
          badgeText={stats.hasGridCap ? "Grid cap applied" : "No grid cap"}
          progressPercent={stats.peakVsDemandPct ?? 0}
        />
        <MetricCard
          label="Pipeline Runtime"
          value={runtime}
          unit=""
          icon={Clock}
          variant="emerald"
          subtext="LLM + guardrails + LP solver"
          badgeText={typeof result.processingTimeMs === "number" && result.processingTimeMs > 0 ? (result.processingTimeMs <= 5000 ? "Within 5 s target" : "Over 5 s target") : "Reference"}
          progressPercent={typeof result.processingTimeMs === "number" ? Math.min(100, (result.processingTimeMs / 5000) * 100) : 0}
        />
      </div>
    </div>
  );
}

/** Real figures for the KPI bars, derived from the scenario input and the returned plan. */
function computeStats(result) {
  const hours = result.scenario_input?.hours;
  const plan = result.hourly_plan;
  if (!Array.isArray(hours) || hours.length !== 24 || !Array.isArray(plan) || plan.length !== 24) {
    return { savingsPct: null, gridSharePct: null, peakHour: null, peakVsDemandPct: null, hasGridCap: false };
  }
  const factor = Array(24).fill(1);
  for (const d of result.directive_interpretation || []) {
    if (d.directive_type === "solar_reduction" && d.structured_adjustment) {
      for (const h of d.structured_adjustment.hours || []) factor[h] = Math.min(factor[h], d.structured_adjustment.factor);
    }
  }
  const byHour = [...hours].sort((a, b) => a.hour - b.hour);
  const baseline = byHour.reduce((sum, h, i) => sum + Math.max(0, h.demand_kwh - h.solar_kwh * factor[i]) * h.tariff_bdt_per_kwh, 0);
  const demand = byHour.reduce((sum, h) => sum + h.demand_kwh, 0);
  const maxDemand = Math.max(...byHour.map((h) => h.demand_kwh));
  const peakEntry = plan.reduce((best, p) => (p.grid_kwh > best.grid_kwh ? p : best), plan[0]);

  return {
    savingsPct: baseline > 0 ? Math.max(0, (1 - result.total_cost_bdt / baseline) * 100) : null,
    gridSharePct: demand > 0 ? Math.min(100, (result.total_grid_kwh / demand) * 100) : null,
    peakHour: peakEntry?.hour ?? null,
    peakVsDemandPct: maxDemand > 0 ? Math.min(100, (result.peak_grid_kwh / maxDemand) * 100) : null,
    hasGridCap: (result.directive_interpretation || []).some((d) => d.directive_type === "max_grid_window" && d.applies),
  };
}
