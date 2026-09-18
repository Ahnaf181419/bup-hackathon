import { createAuthClient } from "better-auth/react";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});
