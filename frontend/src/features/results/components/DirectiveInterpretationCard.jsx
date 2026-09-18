"use client";

import React from "react";
import { Sparkles, Clock } from "lucide-react";
import { hourRanges } from "@/features/shared/lib/format";

const TYPE_LABELS = {
  solar_reduction: "Solar reduction",
  minimum_battery_reserve: "Battery reserve",
  no_charge_window: "No charging",
  no_discharge_window: "No discharging",
  max_grid_window: "Grid cap",
  no_op: "No effect",
};

const SOURCE_LABELS = {
  llm: { text: "LLM", cls: "badge-purple" },
  fallback: { text: "Backup parser", cls: "badge-amber" },
  "guardrail-no-op": { text: "Guardrail: ignored", cls: "badge-gray" },
};

function constraintText(item) {
  const adj = item.structured_adjustment;
  if (!item.applies || !adj) return null;
  switch (item.directive_type) {
    case "solar_reduction":
      return `Usable solar ${Math.round(adj.factor * 1000) / 10}% of forecast (factor ${adj.factor})`;
    case "minimum_battery_reserve":
      return `Battery ≥ ${adj.minimum_energy_kwh} kWh`;
    case "no_charge_window":
      return "Battery may not charge";
    case "no_discharge_window":
      return "Battery may not discharge";
    case "max_grid_window":
      return `Grid import ≤ ${adj.max_grid_kwh} kWh per hour`;
    default:
      return null;
  }
}

/** Each operator note next to what the pipeline made of it. */
export function DirectiveInterpretationCard({ interpretations, notes = [], sources = [], model }) {
  if (!interpretations || interpretations.length === 0) return null;

  const applied = interpretations.filter((i) => i.applies).length;

  return (
    <section className="card" aria-labelledby="directives-title">
      <div className="card-header">
        <div>
          <h2 id="directives-title" className="card-title">
            <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
            Note interpretation
          </h2>
          <p className="card-desc">
            {model ? `Read by ${model}, ` : "Read by the LLM, "}checked by deterministic guardrails, then applied as
            constraints. {applied} of {interpretations.length} notes changed the plan.
          </p>
        </div>
      </div>

      <ol className="directive-list">
        {interpretations.map((item, idx) => {
          const adj = item.structured_adjustment;
          const hours = adj?.hours || adj?.window || []; // `window`: results cached before the schema fix
          const constraint = constraintText(item);
          const source = SOURCE_LABELS[sources[idx]];
          const n = item.note_index !== undefined ? item.note_index : idx;

          return (
            <li key={idx} className={`directive-item ${item.applies ? "" : "inactive"}`}>
              <div className="directive-note">
                <span className="directive-index">Note {n + 1}</span>
                {notes[n] ? <q>{notes[n]}</q> : <span className="muted">Original text not stored for this run.</span>}
              </div>

              <div className="directive-result">
                <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                  <span className={`badge ${item.applies ? "badge-lime" : "badge-gray"}`}>
                    {TYPE_LABELS[item.directive_type] || item.directive_type}
                  </span>
                  <code className="directive-type">{item.directive_type}</code>
                  {source && <span className={`badge ${source.cls}`}>{source.text}</span>}
                </div>

                {constraint && <p className="directive-constraint">{constraint}</p>}

                {item.applies && hours.length > 0 && (
                  <p className="directive-hours">
                    <Clock size={13} aria-hidden="true" />
                    {hourRanges(hours).map((r) => (
                      <span key={r} className="hour-chip tabular">
                        {r}
                      </span>
                    ))}
                  </p>
                )}

                {item.explanation && <p className="directive-explanation">{item.explanation}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
