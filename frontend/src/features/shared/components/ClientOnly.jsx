"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders children only after hydration, for components that read browser storage on first render. */
export function ClientOnly({ children, fallback = null }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return isClient ? children : fallback;
}
