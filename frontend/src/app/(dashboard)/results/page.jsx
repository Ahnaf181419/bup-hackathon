"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight } from "lucide-react";
import { useHistory } from "@/features/results/hooks/useHistory";
import { LoadingSpinner } from "@/features/shared/components/LoadingSpinner";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { formatBdt, formatKwh, formatDuration } from "@/features/shared/lib/format";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "runs", label: "EnergiQ runs" },
  { key: "reference", label: "Reference answers" },
];

export default function ResultsListPage() {
  const { history, isLoading } = useHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const q = searchTerm.trim().toLowerCase();
  const filtered = history.filter((item) => {
    const matchesSearch =
      !q || (item.scenario_id || "").toLowerCase().includes(q) || (item.label || "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" || (filter === "reference" ? item.isReference : !item.isReference);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="stack">
      <div className="page-header-row">
        <div className="header-title-group">
          <h1 className="page-title">Runs</h1>
          <p className="page-subtitle">Every saved plan, with the public reference answers for comparison.</p>
        </div>
        <div className="header-actions">
          <Link href="/optimize" className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            <span>New optimization</span>
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="pill-tab-group" role="tablist" aria-label="Filter runs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={`pill-tab-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="search-field">
          <Search size={15} aria-hidden="true" />
          <label htmlFor="run-search" className="visually-hidden">
            Search runs
          </label>
          <input
            id="run-search"
            type="search"
            className="form-input"
            placeholder="Search by scenario ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size={24} text="Loading runs…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={history.length === 0 ? "No runs yet" : "No runs match"}
          description={
            history.length === 0
              ? "Optimize a scenario and it will be listed here."
              : "Try a different scenario ID or filter."
          }
          action={
            <Link href="/optimize" className="btn-secondary">
              Optimize a scenario
            </Link>
          }
        />
      ) : (
        <div className="data-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Source</th>
                <th scope="col" className="num">Cost (BDT)</th>
                <th scope="col" className="num">Grid (kWh)</th>
                <th scope="col" className="num">Peak (kWh)</th>
                <th scope="col" className="num">Time</th>
                <th scope="col">
                  <span className="visually-hidden">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const id = item._id || item.scenario_id;
                return (
                  <tr key={id}>
                    <td>
                      <Link href={`/results/${id}`} className="table-link">
                        {item.scenario_id}
                      </Link>
                      {item.label && <div className="form-hint">{item.label}</div>}
                    </td>
                    <td>
                      {item.isReference ? (
                        <span className="badge badge-outline">Reference</span>
                      ) : (
                        <span className="badge badge-lime">EnergiQ</span>
                      )}
                    </td>
                    <td className="num">{formatBdt(item.total_cost_bdt)}</td>
                    <td className="num">{formatKwh(item.total_grid_kwh)}</td>
                    <td className="num">{formatKwh(item.peak_grid_kwh)}</td>
                    <td className="num muted">
                      {formatDuration(item.processingTimeMs)}
                    </td>
                    <td className="num">
                      <Link href={`/results/${id}`} className="link-accent" aria-label={`Open ${item.scenario_id}`}>
                        Open <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
