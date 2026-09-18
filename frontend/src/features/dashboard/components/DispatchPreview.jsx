"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { useResult } from "@/features/results/hooks/useResult";
import { EnergyDispatchChart } from "@/features/results/components/EnergyDispatchChart";
import { BatteryStateChart } from "@/features/results/components/BatteryStateChart";
import { formatBdt, formatKwh, durationParts } from "@/features/shared/lib/format";

/**
 * Live preview of the selected run: verified badge, headline figures, and the two
 * hourly charts under one synced cursor so hovering a hour in the dispatch shows
 * the same hour in the battery state.
 */
export function DispatchPreview({ run }) {
  const id = run?._id || run?.scenario_id || null;
  const { result, isLoading } = useResult(id);

  if (!run) {
    return (
      <section className="card dispatch-preview" aria-live="polite">
        <div className="card-header">
          <div>
            <h2 className="card-title">Plan preview</h2>
            <p className="card-desc">Select a run to preview its dispatch here.</p>
          </div>
        </div>
        <div className="chart-empty">
          <p className="muted">No run selected yet.</p>
          <Link href="/optimize" className="btn-secondary btn-sm">Optimize a scenario</Link>
        </div>
      </section>
    );
  }

  const runtime = durationParts(run.processingTimeMs);
  const plan = result?.hourly_plan;
  const hasCharts = Array.isArray(plan) && plan.length > 0;
  const input = result?.scenario_input;
  const hours = input?.hours || [];
  const battery = input?.battery || {};
  const directives = result?.directive_interpretation || [];

  return (
    <div className="dispatch-preview stack">
      <section className="card dispatch-preview-header" aria-live="polite">
        <div className="card-header">
          <div className="stack-sm" style={{ gap: 6 }}>
            <h2 className="run-preview-title">{run.scenario_id}</h2>
            {run.isReference ? (
              <span className="badge badge-outline"><BookOpen size={12} aria-hidden="true" /> Reference answer from the public sample pack</span>
            ) : (
              <span className="badge badge-lime"><ShieldCheck size={12} aria-hidden="true" /> Replay-verified plan</span>
            )}
          </div>
          <Link href={`/results/${id}`} className="btn-secondary btn-sm">
            <span>Open full schedule</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <dl className="figure-row">
          <div>
            <dt>Total cost</dt>
            <dd className="tabular">{formatBdt(run.total_cost_bdt)} <span>BDT</span></dd>
          </div>
          <div>
            <dt>Grid import</dt>
            <dd className="tabular">{formatKwh(run.total_grid_kwh)} <span>kWh</span></dd>
          </div>
          <div>
            <dt>Peak hour draw</dt>
            <dd className="tabular">{formatKwh(run.peak_grid_kwh)} <span>kWh</span></dd>
          </div>
          {runtime !== null && (
            <div>
              <dt>Pipeline time</dt>
              <dd className="tabular">{runtime[0]} <span>{runtime[1]}</span></dd>
            </div>
          )}
        </dl>
      </section>

      {isLoading ? (
        <section className="card chart-skeleton" aria-busy="true">
          <div className="card-header">
            <div>
              <h2 className="card-title">Hourly dispatch</h2>
              <p className="card-desc">Loading plan…</p>
            </div>
          </div>
          <div className="skeleton skeleton-chart" />
        </section>
      ) : hasCharts ? (
        <>
          <EnergyDispatchChart plan={plan} hours={hours} directives={directives} />
          <BatteryStateChart plan={plan} batteryConfig={battery} directives={directives} />
        </>
      ) : (
        <section className="card dispatch-preview">
          <div className="card-header">
            <div>
              <h2 className="card-title">Hourly dispatch</h2>
              <p className="card-desc">Hourly schedule unavailable for this run.</p>
            </div>
          </div>
          <div className="chart-empty">
            <p className="muted">Open the full schedule for the complete result.</p>
            <Link href={`/results/${id}`} className="btn-secondary btn-sm">Open result</Link>
          </div>
        </section>
      )}
    </div>
  );
}
