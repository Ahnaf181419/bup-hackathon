"use client";

import React from "react";
import { History, Coins, TrendingDown, Timer } from "lucide-react";
import { MetricCard } from "@/features/shared/components/MetricCard";
import { CountUpNumber } from "./CountUpNumber";
import { KpiSpark } from "./KpiSpark";
import { formatBdt, durationParts } from "@/features/shared/lib/format";

/**
 * KPI strip for the console. Values count up once real data lands; cost cards
 * carry a sparkline of the same trend the Cost Trend chart draws in full.
 */
export function StatsCards({ stats, isLoading, costTrend = [], timeTrend = [] }) {
  const has = Boolean(stats);
  const dash = isLoading ? "…" : "—";
  const avgTime = has && stats.timedRuns > 0 ? durationParts(stats.avgProcessingTime) : null;
  const int = (n) => Math.round(n).toLocaleString("en-US");

  return (
    <div className="kpi-cards-grid">
      <MetricCard
        label="Runs logged"
        value={has ? <CountUpNumber value={stats.totalRuns} format={int} /> : dash}
        icon={History}
        subtext={!has ? "No runs yet" : stats.source === "server" ? "Your runs plus the public reference answers" : "Runs saved in this browser"}
      />
      <MetricCard
        label="Average daily cost"
        value={has ? <CountUpNumber value={stats.avgCost} format={(n) => formatBdt(n)} /> : dash}
        unit={has ? "BDT" : undefined}
        icon={Coins}
        spark={<KpiSpark points={costTrend} color="var(--accent-cyan)" />}
        subtext="Mean total grid cost per scenario"
      />
      <MetricCard
        label="Lowest daily cost"
        value={has ? <CountUpNumber value={stats.bestCost} format={(n) => formatBdt(n)} /> : dash}
        unit={has ? "BDT" : undefined}
        icon={TrendingDown}
        spark={<KpiSpark points={costTrend} color="var(--accent-lime)" />}
        subtext="Cheapest plan on record"
      />
      <MetricCard
        label="Average pipeline time"
        value={avgTime ? avgTime[0] : dash}
        unit={avgTime ? avgTime[1] : undefined}
        icon={Timer}
        spark={<KpiSpark points={timeTrend} color="var(--accent-amber)" />}
        subtext={has && stats.timedRuns > 0 ? `Over ${stats.timedRuns} timed run${stats.timedRuns === 1 ? "" : "s"} · target 5 s` : "Run a scenario to measure"}
      />
    </div>
  );
}
