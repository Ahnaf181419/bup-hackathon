"use client";

import React from "react";
import { History, Coins, TrendingDown, Timer } from "lucide-react";
import { MetricCard } from "@/features/shared/components/MetricCard";
import { formatBdt, durationParts } from "@/features/shared/lib/format";

export function StatsCards({ stats, isLoading }) {
  const has = Boolean(stats);
  const dash = isLoading ? "…" : "—";
  const avgTime = has && stats.timedRuns > 0 ? durationParts(stats.avgProcessingTime) : null;

  return (
    <div className="kpi-cards-grid">
      <MetricCard
        label="Runs logged"
        value={has ? stats.totalRuns : dash}
        icon={History}
        subtext={!has ? "No runs yet" : stats.source === "server" ? "Your runs plus the public reference answers" : "Runs saved in this browser"}
      />
      <MetricCard
        label="Average daily cost"
        value={has ? formatBdt(stats.avgCost) : dash}
        unit={has ? "BDT" : undefined}
        icon={Coins}
        subtext="Mean total grid cost per scenario"
      />
      <MetricCard
        label="Lowest daily cost"
        value={has ? formatBdt(stats.bestCost) : dash}
        unit={has ? "BDT" : undefined}
        icon={TrendingDown}
        subtext="Cheapest plan on record"
      />
      <MetricCard
        label="Average pipeline time"
        value={avgTime ? avgTime[0] : dash}
        unit={avgTime ? avgTime[1] : undefined}
        icon={Timer}
        subtext={has && stats.timedRuns > 0 ? `Over ${stats.timedRuns} timed run${stats.timedRuns === 1 ? "" : "s"} · target 5 s` : "Run a scenario to measure"}
      />
    </div>
  );
}
