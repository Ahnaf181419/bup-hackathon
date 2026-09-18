"use client";

import React from "react";
import { ToastProvider } from "@/features/shared/context/ToastContext";

export function Providers({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
