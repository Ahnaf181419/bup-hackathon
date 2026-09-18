"use client";

import React from "react";
import { Navbar } from "@/features/shared/components/Navbar";
import { ErrorBoundary } from "@/features/shared/components/ErrorBoundary";
import { AIAssistantDrawer } from "@/features/shared/components/AIAssistantDrawer";
import { LLM_MODEL_LABEL } from "@/features/shared/lib/constants";

export default function DashboardLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <main className="app-main">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <AIAssistantDrawer />
      <footer className="app-footer">
        <span>EnergiQ · BUP CSE Fest 2026 Hackathon</span>
        <span>LLM: {LLM_MODEL_LABEL} · Solver: javascript-lp-solver</span>
      </footer>
    </div>
  );
}
