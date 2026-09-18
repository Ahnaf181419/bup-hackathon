"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Sparkles, Filter, ChevronDown } from "lucide-react";
import { StatsCards } from "@/features/dashboard/components/StatsCards";
import { RecentRunsList } from "@/features/dashboard/components/RecentRunsList";
import { QuickRunPromptCard } from "@/features/dashboard/components/QuickRunPromptCard";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { useHistory } from "@/features/results/hooks/useHistory";
import { LLM_MODEL_LABEL } from "@/features/shared/lib/constants";

export default function DashboardPage() {
  const { stats } = useDashboardStats();
  const { history } = useHistory();
  const [selectedRun, setSelectedRun] = useState(null);

  const activeRun = selectedRun || history[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">
            <span>Energy Operations Console</span>
            <span className="badge badge-lime">Live Dispatch</span>
          </h1>
          <p className="page-subtitle">
            BUP Central Microgrid · 24-hour campus energy schedule, battery storage cycles, and LLM directives.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/optimize" className="btn-primary">
            <Play size={16} fill="#070e02" />
            <span>Launch 24h Optimizer</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards Grid — Matching Reference Dashboard Top Section */}
      <StatsCards stats={stats} />

      {/* Filter / Preset Chips Bar — Matching Reference Filter Row */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-badge-counter">
            <span>Active Filters</span>
            <span className="filter-count-circle">4</span>
          </div>

          <div className="filter-pill-select">
            <span>Facility: BUP Campus Microgrid</span>
            <ChevronDown size={14} />
          </div>

          <div className="filter-pill-select">
            <span>Storage: 1,000 kWh Battery</span>
            <ChevronDown size={14} />
          </div>

          <div className="filter-pill-select">
            <span>Tariff: TOU Peak / Off-Peak</span>
            <ChevronDown size={14} />
          </div>

          <div className="filter-pill-select">
            <span>LLM: {LLM_MODEL_LABEL}</span>
            <Sparkles size={13} color="var(--accent-lime)" />
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Tolerance: ±0.01 kWh/BDT
        </div>
      </div>

      {/* Two-Column Split Layout — Exactly Matching Reference Screenshot */}
      <div className="dashboard-split-layout">
        {/* Left Column: Recent Runs Queue */}
        <RecentRunsList
          runs={history}
          selectedId={activeRun?._id || activeRun?.scenario_id}
          onSelectRun={(run) => setSelectedRun(run)}
        />

        {/* Right Column: Selected Run Showcase / Hero Card */}
        <QuickRunPromptCard selectedRun={activeRun} />
      </div>
    </div>
  );
}
