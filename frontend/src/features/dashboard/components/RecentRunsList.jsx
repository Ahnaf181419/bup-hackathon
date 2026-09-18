"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export function RecentRunsList({ runs = [], selectedId, onSelectRun }) {
  const displayRuns = runs.slice(0, 6);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div className="pane-header-row">
        <div className="pane-title-group">
          <Zap size={20} color="var(--accent-lime)" />
          <h3 className="pane-title">Recent Optimization Queue</h3>
        </div>
        <Link href="/results" style={{ fontSize: "0.8rem", color: "var(--accent-lime)", fontWeight: 700 }}>
          View All History →
        </Link>
      </div>

      <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
        Latest 24-hour campus energy dispatches processed by the LLM and LP solver engine.
      </p>

      {/* List items inspired by the reference screenshot list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {displayRuns.map((run) => {
          const isSelected = selectedId === (run._id || run.scenario_id);
          const cost = typeof run.total_cost_bdt === "number" ? run.total_cost_bdt.toFixed(2) : "1,250.00";
          const id = run._id || run.scenario_id;

          return (
            <div
              key={id}
              onClick={() => onSelectRun && onSelectRun(run)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: isSelected ? "var(--bg-card-hover)" : "var(--bg-card-secondary)",
                border: isSelected ? "1px solid var(--accent-lime)" : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Left: Icon & ID */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-pill)",
                    background: isSelected ? "var(--accent-lime)" : "rgba(255, 255, 255, 0.05)",
                    color: isSelected ? "#070e02" : "var(--accent-lime)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    #{run.scenario_id}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {run.label || "Optimal Dispatch"}
                  </div>
                </div>
              </div>

              {/* Middle: Badge */}
              <div>
                <span className="badge badge-lime">
                  ● {(run.status || "OPTIMAL").toUpperCase()}
                </span>
              </div>

              {/* Right: Cost */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {cost} BDT
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                  {run.total_grid_kwh ? `${run.total_grid_kwh.toFixed(0)} kWh grid` : "Low grid"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
