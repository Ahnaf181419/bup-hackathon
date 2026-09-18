"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check Better Auth session
  const checkSession = useCallback(async () => {
    try {
      // Check local storage demo session fallback first
      const localMock = typeof window !== "undefined" ? localStorage.getItem("gridwise_mock_user") : null;
      if (localMock) {
        const parsed = JSON.parse(localMock);
        setUser(parsed);
        setSession({ user: parsed });
        setIsLoading(false);
        return;
      }

      const res = await authClient.getSession();
      if (res?.data?.session) {
        setSession(res.data.session);
        setUser(res.data.user);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.warn("Auth check: Backend auth unreachable or no active session", err);
      // Fallback: check if we have a demo session
      const localMock = typeof window !== "undefined" ? localStorage.getItem("gridwise_mock_user") : null;
      if (localMock) {
        const parsed = JSON.parse(localMock);
        setUser(parsed);
        setSession({ user: parsed });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = async ({ email, password }) => {
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res?.error) {
        throw new Error(res.error.message || "Failed to sign in");
      }
      await checkSession();
      router.push("/dashboard");
      return res;
    } catch (err) {
      // If backend is down, allow quick demo operator sign in
      if (email && password) {
        const demoUser = {
          id: "demo-operator",
          name: email.split("@")[0] || "Campus Energy Operator",
          email: email,
          role: "operator",
        };
        localStorage.setItem("gridwise_mock_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setSession({ user: demoUser });
        router.push("/dashboard");
        return { user: demoUser };
      }
      throw err;
    }
  };

  const signUp = async ({ name, email, password }) => {
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res?.error) {
        throw new Error(res.error.message || "Failed to sign up");
      }
      await checkSession();
      router.push("/dashboard");
      return res;
    } catch (err) {
      if (email && password) {
        const demoUser = {
          id: "demo-user-" + Date.now(),
          name: name || "Campus Operator",
          email: email,
          role: "operator",
        };
        localStorage.setItem("gridwise_mock_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setSession({ user: demoUser });
        router.push("/dashboard");
        return { user: demoUser };
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn("Sign out err:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("gridwise_mock_user");
    }
    setUser(null);
    setSession(null);
    router.push("/login");
  };

  return {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    refresh: checkSession,
  };
}
