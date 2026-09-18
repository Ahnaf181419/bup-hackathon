"use client";

import React from "react";
import { Coins, Zap, Activity, Timer, ShieldCheck, BookOpen } from "lucide-react";
import { MetricCard } from "@/features/shared/components/MetricCard";
import { formatBdt, formatKwh, formatHour, durationParts } from "@/features/shared/lib/format";

export function ResultSummaryCard({ result, isReference }) {
  if (!result) return null;

  const stats = computeStats(result);
  const ms = !isReference && typeof result.processingTimeMs === "number" && result.processingTimeMs > 0 ? result.processingTimeMs : null;
  const time = durationParts(ms);
  const summaryPoints = (result.plan_summary || "")
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="stack">
      <div className="kpi-cards-grid">
        <MetricCard
          label="Total cost"
          value={formatBdt(result.total_cost_bdt)}
          unit="BDT"
          icon={Coins}
          isHighlight
          subtext={
            stats.savingsPct !== null ? (
              <>
                <span className="positive">{stats.savingsPct.toFixed(1)}% less</span> than the same day without the battery
              </>
            ) : (
              "Sum of grid import × tariff"
            )
          }
        />
        <MetricCard
          label="Grid import"
          value={formatKwh(result.total_grid_kwh)}
          unit="kWh"
          icon={Zap}
          subtext={stats.gridSharePct !== null ? `${stats.gridSharePct.toFixed(0)}% of the day's demand` : "Total over 24 hours"}
        />
        <MetricCard
          label="Peak hour draw"
          value={formatKwh(result.peak_grid_kwh)}
          unit="kWh"
          icon={Activity}
          subtext={
            stats.peakHour !== null
              ? `At ${formatHour(stats.peakHour)}${stats.hasGridCap ? " · grid cap applied" : ""}`
              : "Highest single-hour import"
          }
        />
        <MetricCard
          label="Pipeline time"
          value={time ? time[0] : "—"}
          unit={time ? time[1] : undefined}
          icon={Timer}
          subtext={ms === null ? (isReference ? "Not timed: reference answer" : "Not recorded") : ms <= 5000 ? "Within the 5 s target" : "Over the 5 s target"}
        />
      </div>

      <section className="card" aria-labelledby="summary-title">
        <div className="card-header">
          <h2 id="summary-title" className="card-title">Plan summary</h2>
          {isReference ? (
            <span className="badge badge-outline">
              <BookOpen size={12} aria-hidden="true" /> Reference answer, not an EnergiQ run
            </span>
          ) : (
            <span className="badge badge-lime" title="The backend replays every hour before returning a plan">
              <ShieldCheck size={12} aria-hidden="true" /> Replay-verified: balance, battery limits, directives, end-of-day energy
            </span>
          )}
        </div>
        {summaryPoints.length > 0 ? (
          <ul className="summary-list">
            {summaryPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ fontSize: "var(--text-sm)" }}>No summary was returned for this run.</p>
        )}
      </section>
    </div>
  );
}

/** Figures derived from the scenario input and the returned plan (no placeholders). */
function computeStats(result) {
  const hours = result.scenario_input?.hours;
  const plan = result.hourly_plan;
  const empty = { savingsPct: null, gridSharePct: null, peakHour: null, hasGridCap: false };
  if (!Array.isArray(plan) || plan.length !== 24) return empty;

  const peakEntry = plan.reduce((best, p) => (p.grid_kwh > best.grid_kwh ? p : best), plan[0]);
  const hasGridCap = (result.directive_interpretation || []).some((d) => d.directive_type === "max_grid_window" && d.applies);
  if (!Array.isArray(hours) || hours.length !== 24) return { ...empty, peakHour: peakEntry?.hour ?? null, hasGridCap };

  const factor = Array(24).fill(1);
  for (const d of result.directive_interpretation || []) {
    if (d.directive_type === "solar_reduction" && d.applies && d.structured_adjustment) {
      for (const h of d.structured_adjustment.hours || []) factor[h] = Math.min(factor[h], d.structured_adjustment.factor);
    }
  }
  const byHour = [...hours].sort((a, b) => a.hour - b.hour);
  // Same day with no battery: every hour imports whatever usable solar doesn't cover.
  const baseline = byHour.reduce((sum, h, i) => sum + Math.max(0, h.demand_kwh - h.solar_kwh * factor[i]) * h.tariff_bdt_per_kwh, 0);
  const demand = byHour.reduce((sum, h) => sum + h.demand_kwh, 0);

  return {
    savingsPct: baseline > 0 ? Math.max(0, (1 - result.total_cost_bdt / baseline) * 100) : null,
    gridSharePct: demand > 0 ? Math.min(100, (result.total_grid_kwh / demand) * 100) : null,
    peakHour: peakEntry?.hour ?? null,
    hasGridCap,
  };
}
