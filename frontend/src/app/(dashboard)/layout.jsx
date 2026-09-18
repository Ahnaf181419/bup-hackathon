"use client";

import React from "react";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { Navbar } from "@/features/shared/components/Navbar";
import { ErrorBoundary } from "@/features/shared/components/ErrorBoundary";
import { AIAssistantDrawer } from "@/features/shared/components/AIAssistantDrawer";

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="app-container">
          <Navbar />
          <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <AIAssistantDrawer />
          <footer
            style={{
              marginTop: "auto",
              paddingTop: "24px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.775rem",
              color: "var(--text-muted)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span>GridWise Energy Optimization Platform · BUP CSE Fest 2026 Hackathon</span>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <span>Deterministic LP Solver: javascript-lp-solver</span>
              <span>LLM Engine: Google Gemini 2.5</span>
              <span>Tolerance: ±0.01 kWh/BDT</span>
            </div>
          </footer>
        </div>
      </AuthGuard>
  );
}
