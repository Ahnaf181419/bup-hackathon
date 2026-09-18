"use client";

import React from "react";
import { ToastProvider } from "@/features/shared/context/ToastContext";
import { CustomCursor } from "@/features/shared/motion/CustomCursor";

export function Providers({ children }) {
  return (
    <ToastProvider>
      {children}
      <CustomCursor />
    </ToastProvider>
  );
}
