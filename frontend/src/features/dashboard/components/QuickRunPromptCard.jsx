"use client";

import React from "react";
import Link from "next/link";
import { Zap, Play, ArrowRight, ShieldCheck, Sun, BatteryCharging, CheckCircle2 } from "lucide-react";

export function QuickRunPromptCard({ selectedRun }) {
  const scenario = selectedRun || {
    scenario_id: "SAMPLE-01",
    label: "Solar cleaning + distractor",
    total_cost_bdt: 1475.0,
    total_grid_kwh: 195.0,
    peak_grid_kwh: 35.0,
    status: "optimal",
    processingTimeMs: 412,
  };

  const id = scenario._id || scenario.scenario_id;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        padding: "26px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
      }}
    >
      {/* Top Details Row — Matching Reference Invoice Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Active Campus Dispatch Details
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              #{scenario.scenario_id}
            </h2>
            <span className="badge badge-lime">Verified Optimal</span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Target Grid Facility
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "var(--radius-pill)",
                background: "linear-gradient(135deg, #a3e635 0%, #38bdf8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#070e02",
                fontWeight: 800,
                fontSize: "0.7rem",
              }}
            >
              B
            </div>
            <strong style={{ fontSize: "0.95rem" }}>BUP Central Microgrid</strong>
          </div>
        </div>
      </div>

      {/* 3 Metric Sub-Cards — Matching Reference Mini-Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <div
          style={{
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-lime)" }}>
            <Sun size={15} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Solar Utilization
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            100%
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>0% curtailed</span>
        </div>

        <div
          style={{
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-cyan)" }}>
            <BatteryCharging size={15} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Battery Neutrality
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            Neutral (±0.01)
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Hour 23 SoC restored</span>
        </div>

        <div
          style={{
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-amber)" }}>
            <Zap size={15} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Peak Grid Draw
            </span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            {scenario.peak_grid_kwh ? `${scenario.peak_grid_kwh.toFixed(1)} kWh` : "35.0 kWh"}
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Capped & load-shifted</span>
        </div>
      </div>

      {/* Bottom Summary Bar — Matching Reference Bottom Row with Neon Action Button */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>Total Grid Import</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {scenario.total_grid_kwh ? `${scenario.total_grid_kwh.toFixed(1)} kWh` : "195.0 kWh"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>Optimized Net Cost</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-lime)" }}>
              {typeof scenario.total_cost_bdt === "number"
                ? scenario.total_cost_bdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "38,365.00"} BDT
            </div>
          </div>
        </div>

        <Link
          href={`/results/${id}`}
          className="btn-primary"
          style={{ height: "46px", padding: "0 28px", fontSize: "0.95rem" }}
        >
          <span>Inspect 24h Schedule & Charts</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
