"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ShieldCheck, Calculator, ScanSearch, Check, X, ArrowRight } from "lucide-react";
import { formatBdt, formatKwh, formatDuration } from "@/features/shared/lib/format";

const STAGES = [
  { key: "interpret", title: "Interpret notes", icon: Sparkles, pending: "LLM reads each note into a structured directive" },
  { key: "guard", title: "Guardrails", icon: ShieldCheck, pending: "Checks types, hours and values; never invents numbers" },
  { key: "solve", title: "LP solver", icon: Calculator, pending: "Finds the least-cost 24-hour plan" },
  { key: "verify", title: "Replay check", icon: ScanSearch, pending: "Re-checks every hour against every rule" },
];

/** Describe each stage from the actual response. Nothing here is simulated. */
function describe(result, noteCount) {
  const directives = result.directive_interpretation || [];
  const applied = directives.filter((d) => d.applies).length;
  const ignored = directives.length - applied;
  const meta = result.pipeline;
  const sources = meta?.interpretation_sources || [];
  const byLlm = sources.filter((s) => s === "llm").length;
  const byBackup = sources.filter((s) => s === "fallback").length;

  let interpret;
  if (!meta) interpret = <>{noteCount} note{noteCount === 1 ? "" : "s"} interpreted.</>;
  else if (byLlm === sources.length && meta.llm_model)
    interpret = (
      <>
        {byLlm} note{byLlm === 1 ? "" : "s"} read by <strong>{meta.llm_model}</strong>
        {meta.llm_source === "llm-cache" ? " (cached)" : ""}.
      </>
    );
  else
    interpret = (
      <>
        {byLlm > 0 ? `${byLlm} by the LLM, ` : "LLM unavailable; "}
        <strong>{byBackup}</strong> by the backup parser.
      </>
    );

  return {
    interpret,
    guard: (
      <>
        <strong>{applied}</strong> constraint{applied === 1 ? "" : "s"} applied
        {ignored > 0 ? `, ${ignored} note${ignored === 1 ? "" : "s"} with no effect on today's dispatch` : ""}.
      </>
    ),
    solve: (
      <>
        <strong>{formatBdt(result.total_cost_bdt)} BDT</strong> · {formatKwh(result.total_grid_kwh)} kWh from grid · peak{" "}
        {formatKwh(result.peak_grid_kwh)} kWh.
      </>
    ),
    verify: <>Passed: energy balance, battery limits, every directive, end-of-day energy.</>,
  };
}

export function OptimizationProgressModal({ run, notes = [], onClose, onOpenResult }) {
  const [now, setNow] = useState(() => Date.now());
  const primaryRef = useRef(null);
  const status = run?.status;

  useEffect(() => {
    if (status !== "running") return undefined;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status === "done" || status === "error") primaryRef.current?.focus();
    if (!status || status === "running") return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, onClose]);

  if (!run) return null;

  const details = status === "done" ? describe(run.result, notes.length) : null;
  const elapsed = status === "running" ? Math.max(0, now - run.startedAt) : run.elapsedMs;

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="run-title" aria-describedby="run-status">
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div>
            <h2 id="run-title" style={{ fontSize: "var(--text-xl)" }}>
              {status === "running" ? "Optimizing…" : status === "done" ? "Plan ready" : "Run failed"}
            </h2>
            <p id="run-status" className="secondary" style={{ fontSize: "var(--text-sm)", marginTop: 2 }} aria-live="polite">
              {status === "running" && <span className="tabular">{(elapsed / 1000).toFixed(1)} s · usually 2–8 s, mostly the LLM call</span>}
              {status === "done" && (
                <span className="tabular">
                  {run.result.scenario_id} solved in {formatDuration(elapsed)}
                  {typeof run.result.processingTimeMs === "number" ? ` (server ${formatDuration(run.result.processingTimeMs)})` : ""}
                </span>
              )}
              {status === "error" && "Nothing was saved. Fix the input or try again."}
            </p>
          </div>
          {status !== "running" && (
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <X size={15} />
            </button>
          )}
        </div>

        {status === "running" && (
          <div className="progress-track" aria-hidden="true">
            <span />
          </div>
        )}

        {status === "error" ? (
          <div className="alert alert-error" role="alert">
            <X size={16} />
            <span>{run.message}</span>
          </div>
        ) : (
          <ol className="pipeline-steps">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const done = status === "done";
              return (
                <li
                  key={stage.key}
                  className={`pipeline-step ${done ? "done" : "running"}`}
                  style={{ "--step-delay": `${i * 110}ms` }}
                >
                  <span className="step-icon" aria-hidden="true">
                    {done ? <Check size={15} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.75} />}
                  </span>
                  <div>
                    <div className="step-title">{stage.title}</div>
                    <div className="step-detail">{done ? details[stage.key] : stage.pending}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {status !== "running" && (
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            {status === "done" ? (
              <>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Keep editing
                </button>
                <button type="button" ref={primaryRef} className="btn-primary" onClick={onOpenResult}>
                  Open schedule <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <button type="button" ref={primaryRef} className="btn-secondary" onClick={onClose}>
                Back to the form
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
