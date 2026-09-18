"use client";

import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title = "No Data Found",
  description = "Get started by generating an energy schedule or loading a sample case.",
  action,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--bg-card-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--border-medium)",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "var(--radius-pill)",
          background: "rgba(255, 255, 255, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
        }}
      >
        <Icon size={26} />
      </div>
      <div>
        <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </h4>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            maxWidth: "360px",
            marginTop: "4px",
          }}
        >
          {description}
        </p>
      </div>
      {action && <div style={{ marginTop: "6px" }}>{action}</div>}
    </div>
  );
}
