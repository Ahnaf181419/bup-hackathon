"use client";

import React from "react";
import { Sparkles, CheckCircle, XCircle, Clock, FileCode2, MessageSquareQuote } from "lucide-react";

export function DirectiveInterpretationCard({ interpretations }) {
  if (!interpretations || interpretations.length === 0) {
    return null;
  }

  const getDirectiveBadgeColor = (type) => {
    switch (type) {
      case "solar_reduction":
        return "badge-amber";
      case "minimum_battery_reserve":
        return "badge-cyan";
      case "no_charge_window":
      case "no_discharge_window":
        return "badge-rose";
      case "max_grid_window":
        return "badge-purple";
      case "no_op":
        return "badge-gray";
      default:
        return "badge-lime";
    }
  };

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
          <Sparkles size={20} color="var(--accent-lime)" />
          <h3 className="pane-title">LLM Directive Interpretation Audit</h3>
        </div>
        <span className="badge badge-lime">
          {interpretations.filter((i) => i.applies).length} of {interpretations.length} Active Directives
        </span>
      </div>

      <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
        Google Gemini 3.1 Flash-Lite interpretation of natural language operator notes into deterministic optimization constraints. Verified by guardrail schema before dispatch.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {interpretations.map((item, idx) => {
          const adj = item.structured_adjustment;
          const hours = adj?.hours || adj?.window || [];

          return (
            <div
              key={idx}
              style={{
                background: "var(--bg-card-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Top Row: Note Index & Badges */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "var(--radius-pill)",
                      background: "rgba(255, 255, 255, 0.08)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    #{item.note_index !== undefined ? item.note_index + 1 : idx + 1}
                  </span>
                  <span className={`badge ${getDirectiveBadgeColor(item.directive_type)}`}>
                    {item.directive_type}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {item.applies ? (
                    <span className="badge badge-lime" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={12} />
                      <span>Applies</span>
                    </span>
                  ) : (
                    <span className="badge badge-gray" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle size={12} />
                      <span>No-Op (Distractor)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Explanation / Interpretation text */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MessageSquareQuote size={16} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: "1.4" }}>
                  {item.explanation || "No explanation provided."}
                </p>
              </div>

              {/* Structured Adjustment Details if applies */}
              {item.applies && adj && (
                <div
                  style={{
                    background: "#070c12",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ color: "var(--text-secondary)" }}>Active Hours:</span>
                    {hours.length > 0 ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        {hours.map((h) => (
                          <span
                            key={h}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "var(--radius-xs)",
                              background: "rgba(163, 230, 53, 0.15)",
                              color: "var(--accent-lime)",
                              fontWeight: 700,
                              fontFamily: "monospace",
                            }}
                          >
                            {String(h).padStart(2, "0")}:00
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>All 24 hours</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {adj.factor !== undefined && (
                      <span>
                        Factor: <strong style={{ color: "var(--accent-amber)" }}>{adj.factor}</strong>
                      </span>
                    )}
                    {adj.reserve_floor_kwh !== undefined && (
                      <span>
                        Reserve Floor: <strong style={{ color: "var(--accent-cyan)" }}>{adj.reserve_floor_kwh} kWh</strong>
                      </span>
                    )}
                    {adj.max_grid_kwh !== undefined && (
                      <span>
                        Max Grid: <strong style={{ color: "var(--accent-rose)" }}>{adj.max_grid_kwh} kWh</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
