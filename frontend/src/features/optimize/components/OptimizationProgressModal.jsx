"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Cpu, CheckCircle2 } from "lucide-react";

export function OptimizationProgressModal({ isOpen, currentStep = 1 }) {
  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: "LLM Directive Interpretation",
      desc: "Gemini parsing natural-language operator notes into structured directive JSON",
      icon: Sparkles,
      color: "var(--accent-lime)",
    },
    {
      id: 2,
      title: "Deterministic Guardrail Validation",
      desc: "Enforcing time windows, rate bounds, and filtering no-op distractors",
      icon: ShieldCheck,
      color: "var(--accent-cyan)",
    },
    {
      id: 3,
      title: "Linear Programming Dispatch Solver",
      desc: "Simplex algorithm minimizing total campus energy cost across 24 hours",
      icon: Cpu,
      color: "var(--accent-amber)",
    },
    {
      id: 4,
      title: "Neutrality & Physics Verification",
      desc: "Validating hourly balance and 24h battery SoC neutrality (±0.01 tolerance)",
      icon: CheckCircle2,
      color: "var(--accent-emerald)",
    },
  ];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-pill)",
              background: "linear-gradient(135deg, #a3e635 0%, #4ade80 100%)",
              color: "#070e02",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Cpu size={24} />
          </div>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
            GridWise Optimization Pipeline
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Computing optimal 24-hour campus energy schedule
          </p>
        </div>

        {/* Steps sequence */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", margin: "10px 0" }}>
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: isCurrent
                    ? "rgba(163, 230, 53, 0.08)"
                    : isCompleted
                    ? "rgba(255, 255, 255, 0.03)"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid rgba(163, 230, 53, 0.3)"
                    : "1px solid transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-pill)",
                    background: isCompleted
                      ? "var(--accent-lime)"
                      : isCurrent
                      ? step.color
                      : "rgba(255, 255, 255, 0.08)",
                    color: isCompleted || isCurrent ? "#070e02" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: isCurrent
                          ? "var(--text-primary)"
                          : isCompleted
                          ? "var(--accent-lime)"
                          : "var(--text-muted)",
                      }}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <div className="spinner" style={{ width: "14px", height: "14px" }} />
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--text-secondary)",
                      marginTop: "2px",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Strictly maintaining BUP CSE Fest 2026 Problem Statement specifications
        </div>
      </div>
    </div>
  );
}
