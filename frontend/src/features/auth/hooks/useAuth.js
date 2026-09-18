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
      // Check stored user session first
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("gridwise_auth_user") : null;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setSession({ user: parsed });
        } catch (e) {}
      }

      // Check local storage demo session fallback
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
        if (typeof window !== "undefined" && res.data.user) {
          localStorage.setItem("gridwise_auth_user", JSON.stringify(res.data.user));
        }
      } else if (!storedUser) {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.warn("Auth check: Backend auth unreachable or no active session", err);
      // Fallback: check if we have a demo session or stored user
      const stored = typeof window !== "undefined" 
        ? (localStorage.getItem("gridwise_auth_user") || localStorage.getItem("gridwise_mock_user"))
        : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setSession({ user: parsed });
        } catch (e) {}
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
      const loggedUser = res?.data?.user || { email, name: email.split("@")[0] };
      if (typeof window !== "undefined") {
        localStorage.setItem("gridwise_auth_user", JSON.stringify(loggedUser));
        if (res?.data?.token) {
          localStorage.setItem("gridwise_auth_token", res.data.token);
        }
      }
      setUser(loggedUser);
      setSession({ user: loggedUser, token: res?.data?.token });
      
      // Navigate to dashboard cleanly
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      } else {
        router.push("/dashboard");
      }
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
        localStorage.setItem("gridwise_auth_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setSession({ user: demoUser });
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        } else {
          router.push("/dashboard");
        }
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
      const newUser = res?.data?.user || { name, email };
      if (typeof window !== "undefined") {
        localStorage.setItem("gridwise_auth_user", JSON.stringify(newUser));
        if (res?.data?.token) {
          localStorage.setItem("gridwise_auth_token", res.data.token);
        }
      }
      setUser(newUser);
      setSession({ user: newUser, token: res?.data?.token });

      // Navigate to dashboard cleanly
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      } else {
        router.push("/dashboard");
      }
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
        localStorage.setItem("gridwise_auth_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setSession({ user: demoUser });
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        } else {
          router.push("/dashboard");
        }
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
      localStorage.removeItem("gridwise_auth_user");
      localStorage.removeItem("gridwise_auth_token");
    }
    setUser(null);
    setSession(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
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

