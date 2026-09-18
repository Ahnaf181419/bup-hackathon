"use client";

import React from "react";
import { Plus, X, MessageSquareText } from "lucide-react";

const MAX_NOTES = 3;

// Example notes written for this UI (not taken from the evaluation set).
const EXAMPLE_NOTES = [
  {
    label: "Panel cleaning",
    text: "Facilities will wash the rooftop solar panels from noon until 2 PM. During cleaning, usable solar should be treated as roughly 25% of the forecast.",
  },
  {
    label: "Evening reserve",
    text: "Keep battery energy at or above 300 kWh from 6 PM to 9 PM for expected campus conference backup.",
  },
  {
    label: "Grid cap",
    text: "Utility alert: limit grid draw to a maximum of 180 kWh per hour between 5 PM and 8 PM.",
  },
  {
    label: "Inverter maintenance",
    text: "Battery inverter maintenance scheduled between 1 PM and 3 PM. Battery discharge is prohibited during this window.",
  },
];

export function OperatorNotesInput({ notes, onChange }) {
  const setNote = (index, value) => {
    const updated = [...notes];
    updated[index] = value;
    onChange(updated);
  };

  const addExample = (text) => {
    const emptyIdx = notes.findIndex((n) => !n.trim());
    if (emptyIdx !== -1) setNote(emptyIdx, text);
    else if (notes.length < MAX_NOTES) onChange([...notes, text]);
    else setNote(notes.length - 1, text);
  };

  return (
    <section className="card" aria-labelledby="notes-title">
      <div className="card-header">
        <div>
          <h2 id="notes-title" className="card-title">
            <MessageSquareText size={18} strokeWidth={1.75} aria-hidden="true" />
            Operator notes
            <span className="muted tabular" style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>
              {notes.length} of {MAX_NOTES}
            </span>
          </h2>
          <p className="card-desc">
            Plain language. The LLM turns each note into one constraint, or ignores it if it doesn&apos;t affect
            today&apos;s dispatch.
          </p>
        </div>
      </div>

      <div className="stack-sm">
        {notes.map((note, index) => (
          <div key={index} className="operator-note-box">
            <div className="row-between">
              <label htmlFor={`note-${index}`} className="form-label">
                Note {index + 1}
              </label>
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(notes.filter((_, i) => i !== index))}
                  className="icon-button danger"
                  style={{ width: 28, height: 28, border: "none" }}
                  aria-label={`Remove note ${index + 1}`}
                  title="Remove note"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <textarea
              id={`note-${index}`}
              rows={3}
              className="form-textarea"
              placeholder="e.g. Keep at least 200 kWh in the battery from 7 PM to 10 PM."
              value={note}
              onChange={(e) => setNote(index, e.target.value)}
              aria-invalid={!note.trim() ? "true" : undefined}
            />
          </div>
        ))}
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <span className="form-hint" style={{ marginRight: 2 }}>
          Examples:
        </span>
        {EXAMPLE_NOTES.map((ex) => (
          <button key={ex.label} type="button" className="chip-button" onClick={() => addExample(ex.text)} title={ex.text}>
            {ex.label}
          </button>
        ))}
      </div>

      {notes.length < MAX_NOTES && (
        <button type="button" onClick={() => onChange([...notes, ""])} className="btn-secondary btn-dashed btn-block">
          <Plus size={16} />
          <span>Add note</span>
        </button>
      )}
    </section>
  );
}
