"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutDashboard, SlidersHorizontal, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", short: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Optimize", short: "Optimize", href: "/optimize", icon: SlidersHorizontal },
  { label: "Results", short: "Results", href: "/results", icon: BarChart3 },
  { label: "Settings", short: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <Link href="/dashboard" className="brand-section" aria-label="GridWise dashboard">
        <span className="brand-logo-icon" aria-hidden="true">
          <Zap size={16} strokeWidth={2.25} fill="currentColor" />
        </span>
        <span className="brand-title">GridWise</span>
        <span className="brand-badge">BUP CSE Fest 2026</span>
      </Link>

      <nav className="nav-pill-cluster" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={1.75} className="nav-icon" aria-hidden="true" />
              <span className="nav-full-label">{item.label}</span>
              <span className="nav-short-label">{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
