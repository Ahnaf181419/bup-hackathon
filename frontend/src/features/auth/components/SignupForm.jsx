"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/features/shared/context/ToastContext";

export function SignupForm() {
  const { signUp } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !email || !password) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      toastSuccess("Account created successfully!");
    } catch (err) {
      const msg = err.message || "Failed to create account";
      setErrorMessage(msg);
      toastError(msg);
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
        boxShadow: "var(--shadow-overlay)",
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
            background: "var(--accent-lime)",
            color: "#070e02",
            marginBottom: "14px",
          }}
        >
          <Zap size={26} />
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Create GridWise Account
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "6px" }}>
          Register as Campus Grid & Energy Dispatcher
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
          <label className="form-label" htmlFor="signup-name">Full Name</label>
          <div style={{ position: "relative" }}>
            <User
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
              id="signup-name"
              type="text"
              className="form-input"
              style={{ width: "100%", paddingLeft: "42px" }}
              placeholder="Dr. Engr. Tanvir Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">Official Campus Email</label>
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
              id="signup-email"
              type="email"
              className="form-input"
              style={{ width: "100%", paddingLeft: "42px" }}
              placeholder="tanvir@bup.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">Password</label>
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
              id="signup-password"
              type="password"
              className="form-input"
              style={{ width: "100%", paddingLeft: "42px" }}
              placeholder="At least 8 characters"
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
              <span>Create Account</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div
        style={{
          textAlign: "center",
          marginTop: "24px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        Already registered?{" "}
        <Link href="/login" style={{ color: "var(--accent-lime)", fontWeight: 700 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
