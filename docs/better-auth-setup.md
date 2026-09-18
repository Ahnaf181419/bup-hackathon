# Better Auth — Frontend Wiring (for Lovable)

## 1. Install

```bash
npm install better-auth
```

## 2. Create the client

`src/lib/auth-client.js` (or `.ts`):

```js
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  fetchOptions: {
    credentials: "include",
  },
});
```

`baseURL` points at the **Express backend**, not the frontend.

## 3. Use it

```js
const { data: session } = authClient.useSession();

await authClient.signUp.email({
  name: "Ada",
  email: "ada@example.com",
  password: "min-8-chars",
});

await authClient.signIn.email({ email, password });

await authClient.signOut();
```

## 4. Rules

- All fetches to the backend MUST send `credentials: "include"`.
- Never read/write the session cookie manually.
- Never put `BETTER_AUTH_SECRET` or `GEMINI_API_KEY` in frontend code.
- If auth calls fail with CORS errors, the Lovable preview domain is not in
  the backend's `CORS_ORIGIN` — tell the backend team to add it.
