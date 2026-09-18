"use client";

import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "Run a scenario or load a public sample to get started.",
  action,
}) {
  return (
    <div className="empty-state">
      <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      <div>
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-desc">{description}</p>
      </div>
      {action}
    </div>
  );
}
