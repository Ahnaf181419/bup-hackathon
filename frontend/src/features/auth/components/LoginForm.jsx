"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/features/shared/context/ToastContext";

export function LoginForm() {
  const { signIn } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      toastSuccess("Welcome back, Energy Operator!");
    } catch (err) {
      const msg = err.message || "Invalid email or password";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn({
        email: "operator@bup.campus.ac.bd",
        password: "GridWiseSecure2026!",
      });
      toastSuccess("Logged in as Demo Campus Operator");
    } catch (err) {
      toastError("Demo login error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "440px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-xl)",
        padding: "36px 32px",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-pill)",
            background: "linear-gradient(135deg, #a3e635 0%, #4ade80 100%)",
            color: "#070e02",
            boxShadow: "var(--shadow-glow)",
            marginBottom: "14px",
          }}
        >
          <Zap size={26} />
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Welcome to GridWise
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "6px" }}>
          Campus Microgrid & Battery Storage Optimization
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--accent-rose-subtle)",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "var(--accent-rose)",
            fontSize: "0.825rem",
            marginBottom: "18px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Operator Email</label>
          <div style={{ position: "relative" }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              id="login-email"
              type="email"
              className="form-input"
              style={{ width: "100%", paddingLeft: "42px" }}
              placeholder="operator@bup.campus.ac.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div style={{ position: "relative" }}>
            <Lock
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              id="login-password"
              type="password"
              className="form-input"
              style={{ width: "100%", paddingLeft: "42px" }}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", marginTop: "8px", height: "46px" }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <>
              <span>Sign In to Console</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
          Or Hackathon Quick Access
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        className="btn-secondary"
        style={{
          width: "100%",
          height: "44px",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          background: "rgba(163, 230, 53, 0.08)",
          borderColor: "rgba(163, 230, 53, 0.3)",
          color: "var(--accent-lime)",
        }}
        disabled={isLoading}
      >
        <ShieldCheck size={18} />
        <span>1-Click Demo Operator Login</span>
      </button>

      <div
        style={{
          textAlign: "center",
          marginTop: "24px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        Need a campus operator account?{" "}
        <Link href="/signup" style={{ color: "var(--accent-lime)", fontWeight: 700 }}>
          Create Account
        </Link>
      </div>
    </div>
  );
}
