"use client";

import React from "react";

/** One labelled number with an optional unit, a single line of real context, and an optional sparkline. */
export function MetricCard({ label, value, unit, icon: Icon, subtext, isHighlight = false, spark = null }) {
  return (
    <div className={`kpi-card ${isHighlight ? "highlight" : ""}`}>
      <div className="kpi-card-header">
        {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden="true" />}
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {spark && <div className="kpi-spark-row">{spark}</div>}
      {subtext && <div className="kpi-footer-row">{subtext}</div>}
    </div>
  );
}
