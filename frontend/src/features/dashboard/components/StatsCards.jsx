"use client";

import React from "react";
import { Zap, CheckCircle2, TrendingDown, Clock, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/features/shared/components/MetricCard";

export function StatsCards({ stats }) {
  const totalRuns = stats?.totalRuns || 10;
  const successRate = stats?.successRate || 100;
  const avgCost = stats?.avgCost ? stats.avgCost.toFixed(2) : "1,420.50";
  const bestCost = stats?.bestCost ? stats.bestCost.toFixed(2) : "890.20";

  return (
    <div className="kpi-cards-grid">
      <MetricCard
        label="Total Optimization Runs"
        value={totalRuns}
        unit="runs"
        icon={Zap}
        variant="cyan"
        subtext="24h schedules solved"
        badgeText="Active"
        progressPercent={80}
      />
      <MetricCard
        label="Simplex Solvability Rate"
        value={`${successRate}%`}
        unit=""
        icon={CheckCircle2}
        variant="lime"
        isHighlight={true}
        subtext="0 infeasible conflicts"
        badgeText="Optimal"
        progressPercent={100}
      />
      <MetricCard
        label="Average 24h Energy Cost"
        value={avgCost}
        unit="BDT"
        icon={Clock}
        variant="amber"
        subtext="Across all campus cases"
        badgeText="Optimized"
        progressPercent={65}
      />
      <MetricCard
        label="Best (Lowest) Campus Cost"
        value={bestCost}
        unit="BDT"
        icon={TrendingDown}
        variant="emerald"
        subtext="Maximum solar utilization"
        badgeText="Record Low"
        progressPercent={95}
      />
    </div>
  );
}
