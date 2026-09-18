"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatsCards } from "@/features/dashboard/components/StatsCards";
import { RecentRunsList } from "@/features/dashboard/components/RecentRunsList";
import { CostTrendChart } from "@/features/dashboard/components/CostTrendChart";
import { PipelineHealthCard } from "@/features/dashboard/components/PipelineHealthCard";
import { DispatchPreview } from "@/features/dashboard/components/DispatchPreview";
import { LiveStatusChip } from "@/features/dashboard/components/LiveStatusChip";
import { AmbientBackdrop } from "@/features/dashboard/components/AmbientBackdrop";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { useHistory } from "@/features/results/hooks/useHistory";

export default function DashboardPage() {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { history, isLoading: historyLoading } = useHistory();
  const [selectedId, setSelectedId] = useState(null);

  const runId = (run) => run?._id || run?.scenario_id;
  const activeRun = history.find((r) => runId(r) === selectedId) || history[0];

  // Chronological run series — feeds the trend chart and the KPI sparklines.
  const trendRows = useMemo(
    () =>
      history
        .filter((r) => typeof r.total_cost_bdt === "number" && Number.isFinite(r.total_cost_bdt))
        .slice()
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        }),
    [history]
  );
  const costTrend = useMemo(() => trendRows.map((r) => r.total_cost_bdt), [trendRows]);
  const timeTrend = useMemo(
    () => trendRows.map((r) => r.processingTimeMs).filter((v) => typeof v === "number" && v > 0),
    [trendRows]
  );
  const trendPoints = useMemo(
    () => trendRows.map((r) => ({ id: r.scenario_id, cost: r.total_cost_bdt, ref: Boolean(r.isReference) })),
    [trendRows]
  );

  return (
    <div className="stack dashboard-shell">
      <AmbientBackdrop />

      <div className="page-header-row dashboard-header">
        <div className="header-title-group">
          <h1 className="page-title">Operations console</h1>
          <p className="page-subtitle">
            Least-cost 24-hour plans for grid import, solar and battery on the BUP campus microgrid.
          </p>
        </div>
        <div className="header-actions">
          <LiveStatusChip source={stats?.source || "server"} />
          <Link href="/optimize" className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            <span>New optimization</span>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} isLoading={statsLoading} costTrend={costTrend} timeTrend={timeTrend} />

      <div className="dashboard-analytics-row">
        <CostTrendChart points={trendPoints} isLoading={historyLoading} />
        <PipelineHealthCard stats={stats} isLoading={statsLoading} />
      </div>

      <div className="dashboard-split-layout dashboard-preview-row">
        <RecentRunsList
          runs={history}
          isLoading={historyLoading}
          selectedId={runId(activeRun)}
          onSelectRun={(run) => setSelectedId(runId(run))}
        />
        <DispatchPreview run={activeRun} />
      </div>
    </div>
  );
}
