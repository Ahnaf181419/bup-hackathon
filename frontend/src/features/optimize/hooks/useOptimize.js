"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/features/shared/lib/api";
import { useToast } from "@/features/shared/context/ToastContext";
import { getSampleCaseById } from "@/features/shared/lib/sampleCases";

const DRAFT_KEY = "gridwise_draft_scenario";

// The form is wrapped in <ClientOnly> (see optimize/page.jsx), so reading sessionStorage here is safe.
function readDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

/**
 * Form state plus one run at a time. `run` is null, or:
 *   { status: "running", startedAt }
 *   { status: "done", result, elapsedMs }
 *   { status: "error", message }
 */
export function useOptimize() {
  const router = useRouter();
  const { success: toastSuccess } = useToast();

  const [initial] = useState(() => {
    const d = getSampleCaseById("SAMPLE-01");
    const fallback = {
      scenarioId: d.input.scenario_id,
      operatorNotes: d.input.operator_notes,
      hours: d.input.hours,
      battery: d.input.battery,
      activeCaseId: "SAMPLE-01",
    };
    const draft = typeof window !== "undefined" ? readDraft() : null;
    return draft ? { ...fallback, ...draft } : fallback;
  });

  const [scenarioId, setScenarioId] = useState(initial.scenarioId);
  const [operatorNotes, setOperatorNotes] = useState(initial.operatorNotes);
  const [hours, setHours] = useState(initial.hours);
  const [battery, setBattery] = useState(initial.battery);
  const [activeCaseId, setActiveCaseId] = useState(initial.activeCaseId);

  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ scenarioId, operatorNotes, hours, battery, activeCaseId }));
    } catch {
      // Storage unavailable (private mode); the draft just isn't kept.
    }
  }, [scenarioId, operatorNotes, hours, battery, activeCaseId]);

  const loadCase = useCallback(
    (sampleCase) => {
      setActiveCaseId(sampleCase.id);
      setScenarioId(sampleCase.input.scenario_id);
      setOperatorNotes([...sampleCase.input.operator_notes]);
      setHours(JSON.parse(JSON.stringify(sampleCase.input.hours)));
      setBattery({ ...sampleCase.input.battery });
      setError(null);
      toastSuccess(`Loaded ${sampleCase.id}`);
    },
    [toastSuccess]
  );

  const validate = () => {
    if (!scenarioId.trim()) return "Enter a scenario ID.";
    if (!operatorNotes.length || operatorNotes.some((n) => !n.trim())) return "Fill in or remove empty notes (1 to 3 notes).";
    if (hours.length !== 24) return "The hourly table must have exactly 24 hours.";
    if (battery.minimum_energy_kwh > battery.capacity_kwh) return "Minimum energy can't exceed battery capacity.";
    if (battery.initial_energy_kwh < battery.minimum_energy_kwh || battery.initial_energy_kwh > battery.capacity_kwh) {
      return "Starting energy must be between the minimum energy and the capacity.";
    }
    return null;
  };

  const runOptimization = async () => {
    const invalid = validate();
    setError(invalid);
    if (invalid) return;

    const startedAt = Date.now();
    setRun({ status: "running", startedAt });

    const payload = { scenario_id: scenarioId, operator_notes: operatorNotes, hours, battery };

    try {
      // Dashboard route first (persists history and returns pipeline metadata); fall back to the public
      // endpoint only if the dashboard API is unreachable. Input errors (4xx) are shown as they are.
      let result;
      try {
        result = await api.post("/api/energy/optimize", payload);
      } catch (backendErr) {
        if (backendErr.status >= 400 && backendErr.status < 500 && backendErr.status !== 404) {
          throw backendErr;
        }
        result = await api.post("/optimize-energy", payload);
      }
      if (!result.scenario_input) result = { ...result, scenario_input: payload };

      const resultId = result._id || result.scenario_id || `res-${Date.now()}`;
      try {
        localStorage.setItem(`gridwise_result_${resultId}`, JSON.stringify(result));
        localStorage.setItem("gridwise_last_result_id", resultId);
        const existing = JSON.parse(localStorage.getItem("gridwise_history") || "[]");
        const item = {
          _id: resultId,
          scenario_id: result.scenario_id,
          total_cost_bdt: result.total_cost_bdt,
          total_grid_kwh: result.total_grid_kwh,
          peak_grid_kwh: result.peak_grid_kwh,
          plan_summary: result.plan_summary,
          status: "optimal",
          createdAt: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs ?? null,
          directivesCount: result.directive_interpretation?.filter((d) => d.applies).length ?? null,
        };
        localStorage.setItem("gridwise_history", JSON.stringify([item, ...existing.filter((e) => e._id !== resultId)]));
      } catch {
        // Storage full or unavailable: the result page still loads from the backend.
      }

      setRun({ status: "done", result: { ...result, _id: resultId }, elapsedMs: Date.now() - startedAt });
    } catch (err) {
      setRun({ status: "error", message: err.message || "Optimization failed." });
    }
  };

  const closeRun = useCallback(() => setRun(null), []);

  const openResult = useCallback(() => {
    if (run?.status === "done") router.push(`/results/${run.result._id}`);
  }, [run, router]);

  return {
    scenarioId,
    setScenarioId,
    operatorNotes,
    setOperatorNotes,
    hours,
    setHours,
    battery,
    setBattery,
    activeCaseId,
    loadCase,
    isOptimizing: run?.status === "running",
    run,
    closeRun,
    openResult,
    error,
    runOptimization,
  };
}
