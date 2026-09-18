"use client";

import React, { useEffect, useRef, useState } from "react";
import { Gauge, Target } from "lucide-react";
import { durationParts } from "@/features/shared/lib/format";

const TARGET_MS = 5000;

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** One 180° arc path from angle `a0` to `a1` (degrees, 180 = left end of the gauge). */
function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

/**
 * Pipeline health: average LLM→guardrail→LP time against the 5 s target, plus the
 * success rate of every logged run. Arcs animate once on mount via a CSS stroke
 * transition; the global prefers-reduced-motion override collapses it instantly.
 */
export function PipelineHealthCard({ stats, isLoading = false }) {
  const [armed, setArmed] = useState(false);
  const prevRef = useRef(null);

  useEffect(() => {
    if (prevRef.current === null) {
      const t = setTimeout(() => setArmed(true), 60);
      return () => clearTimeout(t);
    }
    prevRef.current = null;
  }, []);

  if (isLoading || !stats) {
    return (
      <section className="card pipeline-health" aria-busy="true">
        <div className="card-header">
          <div>
            <h2 className="card-title"><Gauge size={18} strokeWidth={1.75} aria-hidden="true" /> Pipeline health</h2>
            <p className="card-desc">{isLoading ? "Measuring…" : "No timed runs yet."}</p>
          </div>
        </div>
        <div className="skeleton skeleton-gauge" />
      </section>
    );
  }

  const timed = stats.timedRuns > 0;
  const avgMs = timed ? stats.avgProcessingTime : null;
  const ratio = avgMs !== null ? Math.min(avgMs / TARGET_MS, 1) : 0;
  const met = avgMs !== null && avgMs <= TARGET_MS;

  // Gauge geometry: 180° arc, value drawn from the left.
  const C = 90, R = 70, STROKE = 11;
  const trackLen = Math.PI * R;
  const valueLen = trackLen * ratio;

  // Success ring geometry.
  const RS = 17, RS_C = 22;
  const ringLen = 2 * Math.PI * RS;
  const successRatio = Math.min((stats.successRate ?? 100) / 100, 1);

  const arcColor = !timed ? "var(--accent-lime)" : met ? "var(--accent-lime)" : "var(--accent-amber)";

  return (
    <section className="card pipeline-health" aria-labelledby="pipeline-title">
      <div className="card-header">
        <div>
          <h2 id="pipeline-title" className="card-title">
            <Gauge size={18} strokeWidth={1.75} aria-hidden="true" />
            Pipeline health
          </h2>
          <p className="card-desc">LLM → guardrails → LP solver, per run.</p>
        </div>
      </div>

      <div
        className="ph-gauge-wrap"
        role="img"
        aria-label={
          timed
            ? `Average pipeline time ${(avgMs / 1000).toFixed(2)} seconds of the 5 second target, ${met ? "target met" : "over target"}, across ${stats.timedRuns} timed runs. Success rate ${stats.successRate} percent.`
            : `No timed runs yet. Success rate ${stats.successRate ?? 100} percent.`
        }
      >
        <svg viewBox="0 0 180 104" className="ph-gauge" aria-hidden="true">
          <path d={arcPath(C, 92, R, 180, 360)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} strokeLinecap="round" />
          <path
            d={arcPath(C, 92, R, 180, 360)}
            fill="none"
            stroke={arcColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${armed ? valueLen : 0} ${trackLen}`}
            className="ph-arc"
            style={{ filter: `drop-shadow(0 0 6px ${met || !timed ? "rgba(163,230,53,0.35)" : "rgba(251,191,36,0.35)"})` }}
          />
          {/* Target tick at the end of the arc (100% = 5 s). */}
          <line
            x1={polar(C, 92, R - STROKE - 3, 358)[0]}
            y1={polar(C, 92, R - STROKE - 3, 358)[1]}
            x2={polar(C, 92, R + STROKE / 2 + 3, 358)[0]}
            y2={polar(C, 92, R + STROKE / 2 + 3, 358)[1]}
            stroke="rgba(241,245,249,0.4)"
            strokeWidth={1.5}
          />
        </svg>

        <div className="ph-gauge-readout">
          {timed ? (
            <>
              <span className="ph-gauge-value tabular">{durationParts(avgMs)?.[0] ?? "—"}</span>
              <span className="ph-gauge-unit">{durationParts(avgMs)?.[1] ?? ""}</span>
            </>
          ) : (
            <span className="ph-gauge-value">—</span>
          )}
          <span className={`ph-gauge-verdict ${timed ? (met ? "ok" : "over") : ""}`}>
            <Target size={11} aria-hidden="true" />
            {timed ? (met ? "within 5 s target" : "over 5 s target") : "run to measure"}
          </span>
        </div>
      </div>

      <dl className="ph-stats">
        <div className="ph-stat">
          <dt>Success rate</dt>
          <dd className="ph-stat-value">
            <svg viewBox="0 0 44 44" className="ph-ring" aria-hidden="true">
              <circle cx={RS_C} cy={RS_C} r={RS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
              <circle
                cx={RS_C} cy={RS_C} r={RS}
                fill="none" stroke="var(--accent-lime)" strokeWidth={4} strokeLinecap="round"
                strokeDasharray={`${armed ? ringLen * successRatio : 0} ${ringLen}`}
                className="ph-arc"
                transform={`rotate(-90 ${RS_C} ${RS_C})`}
              />
            </svg>
            <span className="tabular">{stats.successRate ?? 100}%</span>
          </dd>
        </div>
        <div className="ph-stat">
          <dt>Timed runs</dt>
          <dd className="ph-stat-value tabular">{stats.timedRuns ?? 0}</dd>
        </div>
        <div className="ph-stat">
          <dt>Scenarios</dt>
          <dd className="ph-stat-value tabular">{stats.scenarioCount ?? 0}</dd>
        </div>
      </dl>
    </section>
  );
}
