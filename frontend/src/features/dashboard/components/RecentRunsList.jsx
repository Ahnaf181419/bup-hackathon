"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { formatBdt, formatKwh } from "@/features/shared/lib/format";

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function RecentRunsList({ runs = [], isLoading, selectedId, onSelectRun }) {
  const displayRuns = runs.slice(0, 6);
  const costs = displayRuns.map((r) => r.total_cost_bdt).filter((c) => typeof c === "number" && Number.isFinite(c));
  const best = costs.length > 0 ? Math.min(...costs) : null;

  const delta = (run) => {
    if (best === null || typeof run.total_cost_bdt !== "number" || !Number.isFinite(run.total_cost_bdt)) return null;
    const pct = ((run.total_cost_bdt - best) / best) * 100;
    if (pct === 0) return { text: "best", cls: "is-best" };
    return { text: `${pct > 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`, cls: pct > 0 ? "is-over" : "is-under" };
  };

  return (
    <section className="card" aria-labelledby="recent-runs-title">
      <div className="card-header">
        <div>
          <h2 id="recent-runs-title" className="card-title">
            <History size={18} strokeWidth={1.75} aria-hidden="true" />
            Recent runs
          </h2>
          <p className="card-desc">Select a run to preview it.</p>
        </div>
        <Link href="/results" className="link-accent">
          All runs <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>Loading runs…</p>
      ) : displayRuns.length === 0 ? (
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          No runs yet. <Link href="/optimize" className="link-accent">Optimize a scenario</Link> to see it here.
        </p>
      ) : (
        <ul className="run-list">
          {displayRuns.map((run, idx) => {
            const id = run._id || run.scenario_id;
            const isSelected = selectedId === id;
            const when = timeAgo(run.createdAt);
            const d = delta(run);
            return (
              <li key={id} className="run-list-item" style={{ "--stagger-i": idx }}>
                <button
                  type="button"
                  className={`run-item ${isSelected ? "selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelectRun?.(run)}
                >
                  <span className="run-item-main">
                    <span className="run-item-id">
                      {run.scenario_id}
                      {run.isReference && <span className="run-ref-tag" title="Reference answer from the public sample pack">REF</span>}
                    </span>
                    <span className="run-item-meta">
                      {run.isReference ? "Reference answer" : when ? `GridWise run · ${when}` : "GridWise run"}
                    </span>
                  </span>
                  <span className="run-item-figures">
                    <span className="run-item-cost tabular">{formatBdt(run.total_cost_bdt)} BDT</span>
                    <span className="run-item-figures-sub">
                      <span className="run-item-meta tabular">{formatKwh(run.total_grid_kwh, 0)} kWh grid</span>
                      {d && <span className={`run-delta tabular ${d.cls}`}>{d.text}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
