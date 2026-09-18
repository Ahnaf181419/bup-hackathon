"use client";

import React, { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A number that counts up to its final value once data arrives. Renders the
 * formatted target immediately when reduced motion is requested or on first paint,
 * so nothing flickers and SSR output stays stable (values arrive post-mount).
 */
export function CountUpNumber({ value, format = (n) => String(n), duration = 700 }) {
  const [display, setDisplay] = useState(() => (typeof value === "number" ? value : null));
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      setDisplay(null);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (display === null) return <>—</>;
  return <>{format(display)}</>;
}
