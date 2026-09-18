"use client";

import React from "react";

export function LoadingSpinner({ size = 24, text = "Loading…" }) {
  return (
    <div className="loading-block" role="status">
      <div className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
      {text && <span>{text}</span>}
    </div>
  );
}
