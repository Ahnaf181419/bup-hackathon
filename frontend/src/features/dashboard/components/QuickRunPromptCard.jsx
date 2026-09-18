"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, BookOpen } from "lucide-react";
import { formatBdt, formatKwh, durationParts } from "@/features/shared/lib/format";

/** Preview of the selected run: its own summary and figures, nothing inferred. */
export function QuickRunPromptCard({ run, isLoading }) {
  if (!run) {
    return (
      <section className="card run-preview" aria-live="polite">
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          {isLoading ? "Loading…" : "Select a run to preview its plan."}
        </p>
      </section>
    );
  }

  const id = run._id || run.scenario_id;
  const summary = (run.plan_summary || "")
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const runtime = durationParts(run.processingTimeMs);

  return (
    <section className="card run-preview" aria-labelledby="run-preview-title" aria-live="polite">
      <div className="card-header">
        <div className="stack-sm" style={{ gap: 6 }}>
          <h2 id="run-preview-title" className="run-preview-title">{run.scenario_id}</h2>
          {run.isReference ? (
            <span className="badge badge-outline">
              <BookOpen size={12} aria-hidden="true" /> Reference answer from the public sample pack
            </span>
          ) : (
            <span className="badge badge-lime">
              <ShieldCheck size={12} aria-hidden="true" /> Replay-verified plan
            </span>
          )}
        </div>
      </div>

      <dl className="figure-row">
        <div>
          <dt>Total cost</dt>
          <dd className="tabular">
            {formatBdt(run.total_cost_bdt)} <span>BDT</span>
          </dd>
        </div>
        <div>
          <dt>Grid import</dt>
          <dd className="tabular">
            {formatKwh(run.total_grid_kwh)} <span>kWh</span>
          </dd>
        </div>
        <div>
          <dt>Peak hour draw</dt>
          <dd className="tabular">
            {formatKwh(run.peak_grid_kwh)} <span>kWh</span>
          </dd>
        </div>
        {runtime !== null && (
          <div>
            <dt>Pipeline time</dt>
            <dd className="tabular">
              {runtime[0]} <span>{runtime[1]}</span>
            </dd>
          </div>
        )}
      </dl>

      {summary.length > 0 && (
        <div>
          <h3 className="section-label">Plan summary</h3>
          <ul className="summary-list">
            {summary.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="run-preview-actions">
        <Link href={`/results/${id}`} className="btn-secondary">
          <span>Open full schedule</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
