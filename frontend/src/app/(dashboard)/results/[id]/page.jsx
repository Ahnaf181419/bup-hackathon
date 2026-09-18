"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, BarChart3, Clock, Sparkles, BatteryCharging, FileSpreadsheet } from "lucide-react";
import { useResult } from "@/features/results/hooks/useResult";
import { ResultSummaryCard } from "@/features/results/components/ResultSummaryCard";
import { DirectiveInterpretationCard } from "@/features/results/components/DirectiveInterpretationCard";
import { HourlyPlanTable } from "@/features/results/components/HourlyPlanTable";
import { EnergyDispatchChart } from "@/features/results/components/EnergyDispatchChart";
import { BatteryStateChart } from "@/features/results/components/BatteryStateChart";
import { CostBreakdownChart } from "@/features/results/components/CostBreakdownChart";
import { LoadingSpinner } from "@/features/shared/components/LoadingSpinner";

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || "SAMPLE-01";
  const { result, isLoading, error } = useResult(id);

  // Tab view selector: "all", "charts", "table", "audit"
  const [activeTab, setActiveTab] = useState("all");

  if (isLoading) {
    return <LoadingSpinner size={36} text="Fetching Optimal Dispatch Schedule..." />;
  }

  if (error || !result) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <h2 style={{ color: "var(--accent-rose)", marginBottom: "10px" }}>
          Optimization Result Not Found
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
          Could not locate scenario &quot;{id}&quot;.
        </p>
        <Link href="/optimize" className="btn-primary">
          Run New Optimization
        </Link>
      </div>
    );
  }

  const batteryConfig = result.scenario_input?.battery || {
    capacity_kwh: 1000,
    initial_energy_kwh: 400,
    minimum_energy_kwh: 150,
  };

  const hoursData = result.scenario_input?.hours || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Action Row */}
      <div className="page-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/results")}
            className="icon-button"
            title="Back to Results History"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.75rem" }}>
              Scenario Schedule: {result.scenario_id}
            </h1>
            <p className="page-subtitle">
              Verified optimal 24-hour campus energy dispatch and battery storage plan
            </p>
          </div>
        </div>

        <div className="header-actions">
          <Link href="/optimize" className="btn-secondary">
            <Play size={16} />
            <span>Modify & Re-Run</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards & Meta Banner */}
      <ResultSummaryCard result={result} />

      {/* View Filter / Pill Segmented Controls — Matching Reference Tab Style */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>
            Inspect Schedule Views:
          </span>
          <div className="pill-tab-group">
            <button
              className={`pill-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Panels
            </button>
            <button
              className={`pill-tab-btn ${activeTab === "charts" ? "active" : ""}`}
              onClick={() => setActiveTab("charts")}
            >
              Visual Charts
            </button>
            <button
              className={`pill-tab-btn ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              24h Schedule Table
            </button>
            <button
              className={`pill-tab-btn ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              LLM Directives Audit
            </button>
          </div>
        </div>

        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Tolerance: ±0.01 kWh · Neutrality Confirmed
        </div>
      </div>

      {/* Main Content Areas based on Tab */}
      {(activeTab === "all" || activeTab === "charts") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <EnergyDispatchChart plan={result.hourly_plan} />

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            <BatteryStateChart plan={result.hourly_plan} batteryConfig={batteryConfig} />
            <CostBreakdownChart plan={result.hourly_plan} hours={hoursData} />
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "audit") && (
        <DirectiveInterpretationCard interpretations={result.directive_interpretation} />
      )}

      {(activeTab === "all" || activeTab === "table") && (
        <HourlyPlanTable plan={result.hourly_plan} batteryCapacity={batteryConfig.capacity_kwh} />
      )}
    </div>
  );
}
