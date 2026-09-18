"use client";

import React from "react";
import { FolderCheck, Sparkles } from "lucide-react";
import { getSampleCases, getSampleCaseById } from "@/features/shared/lib/sampleCases";

export function QuickTemplateSelector({ onSelectCase, activeCaseId }) {
  const cases = getSampleCases();

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const fullCase = getSampleCaseById(selectedId);
      if (fullCase) {
        onSelectCase(fullCase);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        background: "var(--bg-card-secondary)",
        padding: "10px 16px",
        borderRadius: "var(--radius-pill)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FolderCheck size={16} color="var(--accent-lime)" />
        <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Official Hackathon Benchmark Cases:
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "240px" }}>
        <select
          className="form-select"
          style={{
            flex: 1,
            padding: "6px 14px",
            fontSize: "0.825rem",
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
          }}
          value={activeCaseId || ""}
          onChange={handleSelect}
        >
          <option value="" disabled>
            Select a public sample case (10 available)...
          </option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}: {c.label} ({c.notesCount} notes, Ref Cost: {c.refCost ? `${c.refCost} BDT` : "N/A"})
            </option>
          ))}
        </select>
      </div>

      {activeCaseId && (
        <span
          className="badge badge-lime"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Sparkles size={12} />
          <span>Loaded: {activeCaseId}</span>
        </span>
      )}
    </div>
  );
}
