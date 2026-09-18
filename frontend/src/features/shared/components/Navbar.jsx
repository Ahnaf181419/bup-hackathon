"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutDashboard, Sliders, BarChart3, LogOut, Radio } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "⚡ Optimize Run", href: "/optimize", icon: Zap },
    { label: "Results & History", href: "/results", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Sliders },
  ];

  return (
    <header className="top-nav" role="banner">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Zap size={20} fill="#070e02" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="brand-title">GridWise</span>
          <span className="brand-badge">BUP 2026</span>
        </div>
      </div>

      {/* Central Pill Nav Cluster — Inspired by Reference Screenshot */}
      <nav className="nav-pill-cluster" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Utility / User Section */}
      <div className="nav-utils">
        {/* Status Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.75rem",
            color: "var(--accent-lime)",
            background: "rgba(163, 230, 53, 0.1)",
            border: "1px solid rgba(163, 230, 53, 0.25)",
            borderRadius: "var(--radius-pill)",
            padding: "4px 10px",
            fontWeight: 700,
          }}
        >
          <Radio size={12} className="pulse-icon" />
          <span>LLM Engine Active</span>
        </div>

        {/* User Profile Pill */}
        <div className="user-profile-pill" title={user?.email || "Energy Dispatcher"}>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "O"}
          </div>
          <span className="user-name-text">
            {user?.name || "Operator"}
          </span>
        </div>

        {/* Sign Out Action */}
        <button
          onClick={signOut}
          className="icon-button"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
