"use client";

import { useState, useEffect } from "react";
import { api } from "@/features/shared/lib/api";

/**
 * Aggregate stats for the dashboard. Uses the backend when available, otherwise the runs saved in
 * this browser. Returns null when there is nothing real to show (never placeholder numbers).
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const res = await api.get("/api/dashboard/stats");
        if (res?.stats && res.stats.totalRuns > 0) {
          setStats({ ...res.stats, source: "server" });
          setIsLoading(false);
          return;
        }
      } catch {
        // Fall through to local runs.
      }

      let runs = [];
      try {
        runs = JSON.parse(localStorage.getItem("gridwise_history") || "[]");
      } catch {
        runs = [];
      }
      const costs = runs.map((r) => r.total_cost_bdt).filter((c) => typeof c === "number");
      const times = runs.map((r) => r.processingTimeMs).filter((t) => typeof t === "number" && t > 0);

      setStats(
        costs.length > 0
          ? {
              totalRuns: costs.length,
              avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
              bestCost: Math.min(...costs),
              avgProcessingTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
              timedRuns: times.length,
              source: "local",
            }
          : null
      );
      setIsLoading(false);
    }

    loadStats();
  }, []);

  return { stats, isLoading };
}
