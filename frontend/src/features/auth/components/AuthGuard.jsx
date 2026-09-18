"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export function AuthGuard({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-app)",
          gap: "16px",
        }}
      >
        <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
          Authenticating GridWise Session...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
