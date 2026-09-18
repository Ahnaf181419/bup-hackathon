"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/features/shared/lib/api";
import { useToast } from "@/features/shared/context/ToastContext";
import { getSampleCaseById } from "@/features/shared/lib/sampleCases";

export function useOptimize() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  // Initialize with Sample Case 1
  const defaultCase = getSampleCaseById("SAMPLE-01");

  const [scenarioId, setScenarioId] = useState(defaultCase.input.scenario_id);
  const [operatorNotes, setOperatorNotes] = useState(defaultCase.input.operator_notes);
  const [hours, setHours] = useState(defaultCase.input.hours);
  const [battery, setBattery] = useState(defaultCase.input.battery);
  const [activeCaseId, setActiveCaseId] = useState("SAMPLE-01");

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);

  // Load from sessionStorage on mount if exists
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("gridwise_draft_scenario");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scenarioId) setScenarioId(parsed.scenarioId);
        if (parsed.operatorNotes) setOperatorNotes(parsed.operatorNotes);
        if (parsed.hours) setHours(parsed.hours);
        if (parsed.battery) setBattery(parsed.battery);
        if (parsed.activeCaseId) setActiveCaseId(parsed.activeCaseId);
      }
    } catch (e) {
      console.warn("Could not parse draft scenario", e);
    }
  }, []);

  // Save to sessionStorage on changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "gridwise_draft_scenario",
        JSON.stringify({ scenarioId, operatorNotes, hours, battery, activeCaseId })
      );
    } catch (e) {
      // ignore
    }
  }, [scenarioId, operatorNotes, hours, battery, activeCaseId]);

  const loadCase = useCallback((sampleCase) => {
    setActiveCaseId(sampleCase.id);
    setScenarioId(sampleCase.input.scenario_id);
    setOperatorNotes([...sampleCase.input.operator_notes]);
    setHours(JSON.parse(JSON.stringify(sampleCase.input.hours)));
    setBattery({ ...sampleCase.input.battery });
    toastSuccess(`Loaded ${sampleCase.id} (${sampleCase.label})`);
  }, [toastSuccess]);

  const runOptimization = async () => {
    setError(null);

    // Frontend validation
    if (!scenarioId.trim()) {
      const msg = "Scenario ID cannot be empty";
      setError(msg);
      toastError(msg);
      return;
    }

    if (!operatorNotes || operatorNotes.length === 0 || operatorNotes.some((n) => !n.trim())) {
      const msg = "Please enter 1 to 3 valid operator notes";
      setError(msg);
      toastError(msg);
      return;
    }

    if (hours.length !== 24) {
      const msg = "Hourly schedule must have exactly 24 hours (0-23)";
      setError(msg);
      toastError(msg);
      return;
    }

    if (
      battery.initial_energy_kwh < battery.minimum_energy_kwh ||
      battery.initial_energy_kwh > battery.capacity_kwh
    ) {
      const msg = "Initial battery energy must be between minimum reserve and capacity";
      setError(msg);
      toastError(msg);
      return;
    }

    setIsOptimizing(true);
    setCurrentStep(1);

    // Simulate animated pipeline progress steps
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 700);
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 1500);
    const stepTimer3 = setTimeout(() => setCurrentStep(4), 2200);

    const payload = {
      scenario_id: scenarioId,
      operator_notes: operatorNotes,
      hours,
      battery,
    };

    try {
      // Dashboard route first (persists history); fall back to the public judge endpoint only if
      // the dashboard API is unreachable or failing. Input errors (4xx) are shown to the user.
      // Never substitute reference or locally generated results for a real backend response.
      let result;
      try {
        result = await api.post("/api/energy/optimize", payload);
      } catch (backendErr) {
        if (backendErr.status >= 400 && backendErr.status < 500 && backendErr.status !== 401 && backendErr.status !== 404) {
          throw backendErr;
        }
        console.warn("Dashboard API unavailable, calling /optimize-energy directly", backendErr);
        result = await api.post("/optimize-energy", payload);
      }
      if (!result.scenario_input) result = { ...result, scenario_input: payload };

      // Save result in localStorage for instant view & history
      if (typeof window !== "undefined") {
        const resultId = result._id || result.scenario_id || "res-" + Date.now();
        localStorage.setItem(`gridwise_result_${resultId}`, JSON.stringify(result));
        localStorage.setItem("gridwise_last_result_id", resultId);

        // Append to local history list
        const existingHistory = JSON.parse(localStorage.getItem("gridwise_history") || "[]");
        const historyItem = {
          _id: resultId,
          scenario_id: result.scenario_id,
          total_cost_bdt: result.total_cost_bdt,
          total_grid_kwh: result.total_grid_kwh,
          peak_grid_kwh: result.peak_grid_kwh,
          status: result.status || "optimal",
          createdAt: new Date().toISOString(),
          processingTimeMs: result.processingTimeMs ?? null,
          directivesCount: result.directive_interpretation?.length || operatorNotes.length,
        };
        localStorage.setItem("gridwise_history", JSON.stringify([historyItem, ...existingHistory]));
      }

      toastSuccess("24-Hour Energy Dispatch Optimized!");
      setTimeout(() => {
        setIsOptimizing(false);
        const resultId = result._id || result.scenario_id || "res-latest";
        router.push(`/results/${resultId}`);
      }, 2600);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsOptimizing(false);
      const msg = err.message || "Optimization failed";
      setError(msg);
      toastError(msg);
    }
  };

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
    isOptimizing,
    currentStep,
    error,
    runOptimization,
  };
}
