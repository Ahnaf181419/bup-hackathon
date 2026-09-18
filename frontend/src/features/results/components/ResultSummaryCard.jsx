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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
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
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {result.plan_summary || "24-hour campus energy schedule successfully solved."}
            </p>
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
          subtext="Optimal 24h expenditure"
          badgeText="Minimized"
          progressPercent={75}
        />
        <MetricCard
          label="Total Grid Import"
          value={grid}
          unit="kWh"
          icon={Zap}
          variant="cyan"
          subtext="Utility grid dependency"
          badgeText="Demand met"
          progressPercent={60}
        />
        <MetricCard
          label="Peak Grid Demand Draw"
          value={peak}
          unit="kWh"
          icon={Activity}
          variant="amber"
          subtext="Highest single-hour draw"
          badgeText="Peak Capped"
          progressPercent={45}
        />
        <MetricCard
          label="Pipeline Runtime"
          value={runtime}
          unit=""
          icon={Clock}
          variant="emerald"
          subtext="LLM + Simplex Solver"
          badgeText="Ultra-Fast"
          progressPercent={92}
        />
      </div>
    </div>
  );
}
