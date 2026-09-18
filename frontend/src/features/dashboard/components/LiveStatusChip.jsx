"use client";

import React, { useEffect, useState } from "react";

/**
 * Live status lamp with a mono clock. Renders a stable placeholder until mounted
 * so server and client markup match, then ticks once per second.
 */
export function LiveStatusChip({ source = "server" }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const clock = now
    ? now.toLocaleTimeString("en-GB", { hour12: false })
    : "--:--:--";

  return (
    <div className="live-chip" role="status" aria-label={`Telemetry link active, local time ${clock}`}>
      <span className="live-lamp" aria-hidden="true" />
      <span className="live-chip-text">LIVE</span>
      <span className="live-chip-clock mono tabular">{clock}</span>
      <span className="live-chip-src">{source === "local" ? "this browser" : "atlas"}</span>
    </div>
  );
}
