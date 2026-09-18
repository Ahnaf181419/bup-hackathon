"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { useResult } from "@/features/results/hooks/useResult";
import { ResultSummaryCard } from "@/features/results/components/ResultSummaryCard";
import { DirectiveInterpretationCard } from "@/features/results/components/DirectiveInterpretationCard";
import { HourlyPlanTable } from "@/features/results/components/HourlyPlanTable";
import { EnergyDispatchChart } from "@/features/results/components/EnergyDispatchChart";
import { BatteryStateChart } from "@/features/results/components/BatteryStateChart";
import { CostBreakdownChart } from "@/features/results/components/CostBreakdownChart";
import { LoadingSpinner } from "@/features/shared/components/LoadingSpinner";
import { EmptyState } from "@/features/shared/components/EmptyState";

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { result, isLoading, error } = useResult(id);

  if (isLoading) {
    return <LoadingSpinner size={28} text="Loading schedule…" />;
  }

  if (error || !result) {
    return (
      <EmptyState
        title="Result not found"
        description={`No saved run or sample case matches "${id}".`}
        action={
          <Link href="/results" className="btn-secondary">
            Back to all runs
          </Link>
        }
      />
    );
  }

  const isReference = Boolean(result.isReference || result.userId === "public-benchmark");
  const input = result.scenario_input;
  const battery = input?.battery || {};
  const hours = input?.hours || [];
  const directives = result.directive_interpretation || [];

  // Load this run's input into the optimizer form (the form restores its draft from sessionStorage).
  const editAndRerun = () => {
    if (input) {
      try {
        sessionStorage.setItem(
          "gridwise_draft_scenario",
          JSON.stringify({
            scenarioId: input.scenario_id,
            operatorNotes: input.operator_notes,
            hours: input.hours,
            battery: input.battery,
            activeCaseId: "",
          })
        );
      } catch {
        // Without storage the form opens with its previous draft.
      }
    }
    router.push("/optimize");
  };

  return (
    <div className="stack">
      <div className="page-header-row">
        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <Link href="/results" className="icon-button" aria-label="Back to all runs" title="All runs" style={{ marginTop: 2 }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="header-title-group">
            <h1 className="page-title">{result.scenario_id}</h1>
            <p className="page-subtitle">
              {isReference
                ? "Published reference answer from the public sample pack."
                : "24-hour least-cost plan produced by EnergiQ."}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" onClick={editAndRerun} className="btn-secondary" disabled={!input}>
            <PencilLine size={16} />
            <span>Edit inputs and re-run</span>
          </button>
        </div>
      </div>

      <ResultSummaryCard result={result} isReference={isReference} />

      <DirectiveInterpretationCard
        interpretations={directives}
        notes={input?.operator_notes || []}
        sources={result.pipeline?.interpretation_sources || []}
        model={result.pipeline?.llm_model || null}
      />

      <EnergyDispatchChart plan={result.hourly_plan} hours={hours} directives={directives} />

      <div className="two-col">
        <BatteryStateChart plan={result.hourly_plan} batteryConfig={battery} directives={directives} />
        <CostBreakdownChart plan={result.hourly_plan} hours={hours} />
      </div>

      <HourlyPlanTable plan={result.hourly_plan} batteryCapacity={battery.capacity_kwh} />
    </div>
  );
}
