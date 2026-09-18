"use client";

import React from "react";

/**
 * Decorative control-room backdrop: a faint engineering grid with two slow-breathing
 * radial glows (lime over the KPIs, cyan over the charts). Pure CSS, no interaction,
 * pointer-events none. The breathing animation is neutralised globally under
 * prefers-reduced-motion.
 */
export function AmbientBackdrop() {
  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-glow ambient-glow-lime" />
      <div className="ambient-glow ambient-glow-cyan" />
    </div>
  );
}
