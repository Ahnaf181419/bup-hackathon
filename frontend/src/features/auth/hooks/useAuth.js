"use client";

import { useState, useEffect } from "react";

const DEFAULT_OPERATOR = {
  id: "demo-operator",
  name: "Campus Operator",
  email: "operator@bup.campus.ac.bd",
  role: "Lead Energy Dispatcher",
};

export function useAuth() {
  const [user, setUser] = useState(DEFAULT_OPERATOR);
  const [session, setSession] = useState({ user: DEFAULT_OPERATOR });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gridwise_auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.name) {
            setUser(parsed);
            setSession({ user: parsed });
          }
        } catch (e) {}
      }
    }
  }, []);

  const signIn = async () => {
    return { user: DEFAULT_OPERATOR };
  };

  const signUp = async () => {
    return { user: DEFAULT_OPERATOR };
  };

  const signOut = async () => {
    setUser(DEFAULT_OPERATOR);
    setSession({ user: DEFAULT_OPERATOR });
  };

  return {
    session,
    user,
    isLoading: false,
    signIn,
    signUp,
    signOut,
    refresh: () => {},
  };
}
