"use client";

export function AuthGuard({ children }) {
  // Completely open access: no login, no session blocking, no redirect.
  // Immediately render the operator dashboard for judges and visitors.
  return children;
}
