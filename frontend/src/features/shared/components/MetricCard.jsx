"use client";

import React from "react";

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  variant = "lime",
  progressPercent,
  subtext,
  badgeText,
  isHighlight = false,
}) {
  return (
    <div className={`kpi-card ${isHighlight ? "highlight" : ""}`}>
      <div className="kpi-card-header">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <div className={`kpi-icon-badge ${variant}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>

      <div className="kpi-footer-row">
        {subtext && <span style={{ color: "var(--text-muted)" }}>{subtext}</span>}
        {badgeText && (
          <span className={`badge badge-${variant}`} style={{ marginLeft: "auto" }}>
            {badgeText}
          </span>
        )}
      </div>

      {typeof progressPercent === "number" && (
        <div className="kpi-mini-bar">
          <div
            className="kpi-mini-bar-fill"
            style={{
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              background:
                variant === "lime"
                  ? "var(--accent-lime)"
                  : variant === "cyan"
                  ? "var(--accent-cyan)"
                  : variant === "amber"
                  ? "var(--accent-amber)"
                  : "var(--accent-emerald)",
            }}
          />
        </div>
      )}
    </div>
  );
}
