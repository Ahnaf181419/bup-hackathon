"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatsCards } from "@/features/dashboard/components/StatsCards";
import { RecentRunsList } from "@/features/dashboard/components/RecentRunsList";
import { QuickRunPromptCard } from "@/features/dashboard/components/QuickRunPromptCard";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { useHistory } from "@/features/results/hooks/useHistory";

export default function DashboardPage() {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { history, isLoading: historyLoading } = useHistory();
  const [selectedId, setSelectedId] = useState(null);

  const runId = (run) => run?._id || run?.scenario_id;
  const activeRun = history.find((r) => runId(r) === selectedId) || history[0];

  return (
    <div className="stack">
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">Operations console</h1>
          <p className="page-subtitle">
            Least-cost 24-hour plans for grid import, solar and battery on the BUP campus microgrid.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/optimize" className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            <span>New optimization</span>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} isLoading={statsLoading} />

      <div className="dashboard-split-layout">
        <RecentRunsList
          runs={history}
          isLoading={historyLoading}
          selectedId={runId(activeRun)}
          onSelectRun={(run) => setSelectedId(runId(run))}
        />
        <QuickRunPromptCard run={activeRun} isLoading={historyLoading} />
      </div>
    </div>
  );
}
