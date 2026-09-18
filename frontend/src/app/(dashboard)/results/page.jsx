"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BarChart3, Play, Search, ArrowRight, ShieldCheck, Clock, Zap } from "lucide-react";
import { useHistory } from "@/features/results/hooks/useHistory";
import { LoadingSpinner } from "@/features/shared/components/LoadingSpinner";
import { EmptyState } from "@/features/shared/components/EmptyState";

export default function ResultsListPage() {
  const { history, isLoading } = useHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = history.filter((item) => {
    const matchesSearch =
      (item.scenario_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.label || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Row */}
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">
            <span>Optimization Runs & Audits</span>
            <span className="badge badge-lime">{history.length} Runs Logged</span>
          </h1>
          <p className="page-subtitle">
            Historical energy optimization runs, operator directive interpretations, and solved dispatch schedules.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/optimize" className="btn-primary">
            <Play size={16} fill="#070e02" />
            <span>Launch New Optimization</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar — Styled after Reference Search / Filter Row */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-badge-counter">
            <span>Total Records</span>
            <span className="filter-count-circle">{filtered.length}</span>
          </div>

          <div className="pill-tab-group">
            <button
              className={`pill-tab-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Runs
            </button>
            <button
              className={`pill-tab-btn ${statusFilter === "optimal" ? "active" : ""}`}
              onClick={() => setStatusFilter("optimal")}
            >
              Optimal Only
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: "36px",
              paddingTop: "6px",
              paddingBottom: "6px",
              borderRadius: "var(--radius-pill)",
              fontSize: "0.825rem",
              width: "100%",
            }}
            placeholder="Search scenario or label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table of History Runs */}
      {isLoading ? (
        <LoadingSpinner size={32} text="Loading historical runs..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Optimization Runs Found"
          description="No results match your search filter. Run an energy scenario or load a benchmark."
          action={
            <Link href="/optimize" className="btn-primary">
              Run Optimizer
            </Link>
          }
        />
      ) : (
        <div className="data-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Scenario Case</th>
                <th>Status</th>
                <th>Total Cost (BDT)</th>
                <th>Total Grid (kWh)</th>
                <th>Peak Draw (kWh)</th>
                <th>Directives</th>
                <th>Runtime</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id || item.scenario_id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
                        {item.scenario_id}
                      </strong>
                      {item.label && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-lime">
                      ● {(item.status || "OPTIMAL").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "var(--accent-lime)", fontSize: "0.95rem" }}>
                      {typeof item.total_cost_bdt === "number"
                        ? item.total_cost_bdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "—"} BDT
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                      {typeof item.total_grid_kwh === "number" ? item.total_grid_kwh.toFixed(1) : "—"} kWh
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>
                      {typeof item.peak_grid_kwh === "number" ? item.peak_grid_kwh.toFixed(1) : "—"} kWh
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-cyan">
                      {item.directivesCount || 2} Directives
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item.processingTimeMs ? `${item.processingTimeMs} ms` : "< 500 ms"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/results/${item._id || item.scenario_id}`}
                      className="btn-secondary"
                      style={{ padding: "5px 14px", fontSize: "0.775rem", gap: "4px" }}
                    >
                      <span>Inspect</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
