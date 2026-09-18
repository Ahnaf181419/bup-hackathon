"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/features/shared/lib/api";
import { SAMPLE_CASES } from "@/features/shared/lib/sampleCases";

/** Backend history, merged with runs saved in this browser; public reference answers if both are empty. */
async function loadHistory() {
  let items = [];

  try {
    const data = await api.get("/api/history");
    if (Array.isArray(data?.history)) {
      items = data.history.map((it) => {
        const isReference = it.userId === "public-benchmark";
        // Reference answers were never timed; ignore any runtime stored with them.
        return isReference ? { ...it, isReference, processingTimeMs: null } : { ...it, isReference };
      });
    }
  } catch (err) {
    console.warn("Backend API not reachable for history", err);
  }

  try {
    const local = JSON.parse(localStorage.getItem("gridwise_history") || "[]");
    if (Array.isArray(local)) {
      const seen = new Set(items.map((it) => it._id || it.scenario_id));
      for (const loc of local) {
        if (!seen.has(loc._id) && !seen.has(loc.scenario_id)) items.push(loc);
      }
    }
  } catch (err) {
    console.warn("Could not read local history", err);
  }

  if (items.length === 0) {
    // Public reference answers, clearly marked; they were not produced by a GridWise run.
    items = SAMPLE_CASES.map((c) => ({
      _id: c.id,
      scenario_id: c.id,
      label: c.label,
      total_cost_bdt: c.expected_output?.total_cost_bdt ?? null,
      total_grid_kwh: c.expected_output?.total_grid_kwh ?? null,
      peak_grid_kwh: c.expected_output?.peak_grid_kwh ?? null,
      plan_summary: c.expected_output?.plan_summary ?? null,
      status: "optimal",
      createdAt: null,
      processingTimeMs: null,
      isReference: true,
    }));
  }

  return items;
}

export function useHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadHistory().then((items) => {
      if (cancelled) return;
      setHistory(items);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setHistory(await loadHistory());
    setIsLoading(false);
  }, []);

  return { history, isLoading, error: null, refresh };
}
