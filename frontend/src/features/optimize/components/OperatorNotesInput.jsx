"use client";

import React from "react";
import { Plus, Trash2, Sparkles, MessageSquare } from "lucide-react";

export function OperatorNotesInput({ notes, onChange }) {
  const handleNoteChange = (index, value) => {
    const updated = [...notes];
    updated[index] = value;
    onChange(updated);
  };

  const handleAddNote = () => {
    if (notes.length < 3) {
      onChange([...notes, ""]);
    }
  };

  const handleRemoveNote = (index) => {
    if (notes.length > 1) {
      onChange(notes.filter((_, i) => i !== index));
    }
  };

  const presetDirectives = [
    {
      label: "Solar Wash (Noon-2PM)",
      text: "Facilities will wash the rooftop solar panels from noon until 2 PM. During cleaning, usable solar should be treated as roughly 25% of the forecast.",
    },
    {
      label: "Evening Reserve (6PM-9PM)",
      text: "Keep battery energy at or above 300 kWh from 6 PM to 9 PM for expected campus conference backup.",
    },
    {
      label: "Peak Grid Cap (5PM-8PM)",
      text: "Utility alert: limit grid draw to a maximum of 180 kWh per hour between 5 PM and 8 PM.",
    },
    {
      label: "Maintenance Lock (1PM-3PM)",
      text: "Battery inverter maintenance scheduled between 1 PM and 3 PM. Battery discharge is prohibited during this window.",
    },
  ];

  return (
    <div
      style={{
        background: "var(--bg-card-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} color="var(--accent-lime)" />
          <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Operator Directives & Notes</h4>
        </div>
        <span
          className="badge badge-cyan"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <span>LLM Interpreted</span>
          <span style={{ opacity: 0.7 }}>({notes.length}/3 notes)</span>
        </span>
      </div>

      <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
        Natural language instructions provided by campus operators. GridWise extracts structured constraints (solar reduction, battery reserve floor, grid caps, etc.) and filters out conversational distractors.
      </p>

      {/* Preset Suggestions Quick Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Quick Templates:
        </span>
        {presetDirectives.map((preset, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => {
              // Replace active empty note or append
              const emptyIdx = notes.findIndex((n) => !n.trim());
              if (emptyIdx !== -1) {
                handleNoteChange(emptyIdx, preset.text);
              } else if (notes.length < 3) {
                onChange([...notes, preset.text]);
              } else {
                handleNoteChange(0, preset.text);
              }
            }}
            className="filter-pill-select"
            style={{ fontSize: "0.725rem", padding: "4px 10px" }}
          >
            + {preset.label}
          </button>
        ))}
      </div>

      {/* Notes Textarea List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notes.map((note, index) => (
          <div key={index} className="operator-note-box">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MessageSquare size={14} color="var(--accent-lime)" />
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Operator Note #{index + 1}
                </span>
              </div>
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveNote(index)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-rose)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                  title="Remove note"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <textarea
              rows={3}
              className="form-textarea"
              style={{
                width: "100%",
                background: "#080d13",
                resize: "vertical",
                fontSize: "0.85rem",
                lineHeight: "1.4",
              }}
              placeholder="e.g. Facilities will wash the rooftop solar panels from noon until 2 PM. Usable solar should be 25% of forecast."
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {note.length} characters
            </div>
          </div>
        ))}
      </div>

      {notes.length < 3 && (
        <button
          type="button"
          onClick={handleAddNote}
          className="btn-secondary"
          style={{ width: "100%", height: "38px", borderStyle: "dashed" }}
        >
          <Plus size={16} />
          <span>Add Operator Note ({notes.length}/3)</span>
        </button>
      )}
    </div>
  );
}
