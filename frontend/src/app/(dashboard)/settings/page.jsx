"use client";

import React, { useState } from "react";
import { Sliders, Server, Cpu, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { useToast } from "@/features/shared/context/ToastContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LLM_MODEL_LABEL } from "@/features/shared/lib/constants";

export default function SettingsPage() {
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
  const [tolerance, setTolerance] = useState("0.01");

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gridwise_history");
      sessionStorage.removeItem("gridwise_draft_scenario");
    }
    toastSuccess("Local cache and history successfully reset.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "880px" }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">
            <span>System Settings & Architecture</span>
          </h1>
          <p className="page-subtitle">
            Configure backend connection endpoints, LLM guardrail tolerance, and optimization solver settings.
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Backend API Configuration */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Server size={18} color="var(--accent-lime)" />
            <h3 style={{ fontSize: "1.05rem" }}>Backend API & Auth Endpoint</h3>
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Express.js backend server handling Better Auth, Gemini LLM pipeline, and LP dispatch solver.
          </p>

          <div className="form-group">
            <label className="form-label">API Base URL</label>
            <input
              type="text"
              className="form-input"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>Status: <strong>Ready</strong></span>
            <span>·</span>
            <span>Auth Provider: <strong>Better Auth 1.2</strong></span>
            <span>·</span>
            <span>CORS: <strong>localhost:3000 / localhost:5173</strong></span>
          </div>
        </div>

        {/* Solver & LLM Configuration */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Cpu size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: "1.05rem" }}>Optimization Engine & Guardrails</h3>
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Problem statement compliance parameters for BUP CSE Fest 2026 preliminary evaluation.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">LLM Reasoning Model</label>
              <input
                type="text"
                className="form-input"
                disabled
                value={`${LLM_MODEL_LABEL} via @google/genai`}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Numerical Equivalence Tolerance</label>
              <input
                type="text"
                className="form-input"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                placeholder="±0.01 kWh/BDT"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--accent-lime)" }}>
            <ShieldCheck size={16} />
            <span>End-of-day battery SoC neutrality strictly audited at hour 23</span>
          </div>
        </div>

        {/* Operator Profile */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Database size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: "1.05rem" }}>Active Operator Profile</h3>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <div>Name: <strong style={{ color: "var(--text-primary)" }}>{user?.name || "Campus Operator"}</strong></div>
            <div style={{ marginTop: "4px" }}>Email: <strong style={{ color: "var(--text-primary)" }}>{user?.email || "operator@bup.campus.ac.bd"}</strong></div>
            <div style={{ marginTop: "4px" }}>Role: <span className="badge badge-lime">Lead Energy Dispatcher</span></div>
          </div>
        </div>

        {/* Cache Management */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h4 style={{ fontSize: "0.95rem" }}>Reset Local Cache & Session Drafts</h4>
            <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Clear local history runs and reset scenario draft form to SAMPLE-01 default.
            </p>
          </div>

          <button onClick={handleReset} className="btn-secondary" style={{ gap: "6px" }}>
            <RefreshCw size={14} />
            <span>Clear Local Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
}
