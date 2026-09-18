"use client";

import React from "react";

export function LoadingSpinner({ size = 24, text = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        gap: "12px",
      }}
    >
      <div
        className="spinner"
        style={{ width: `${size}px`, height: `${size}px`, borderWidth: "2.5px" }}
      />
      {text && (
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {text}
        </span>
      )}
    </div>
  );
}
