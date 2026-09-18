# API Contract

Base URL (dev): `http://localhost:3001/api`
All authenticated endpoints require the session cookie
(`credentials: "include"` in fetch/axios).

## Health

### `GET /health`

Public. Returns `{ "status": "ok" }`.

## Auth — Better Auth (all public)

Handled by Better Auth automatically at `/api/auth/*`:

| Method | Path                        | Body                          |
| ------ | --------------------------- | ----------------------------- |
| POST   | `/auth/sign-up/email`       | `{ name, email, password }`   |
| POST   | `/auth/sign-in/email`       | `{ email, password }`         |
| POST   | `/auth/sign-out`            | —                             |
| GET    | `/auth/get-session`         | —                             |

## Users

### `GET /users/me` 🔒

Returns the signed-in user.

```json
{ "user": { "id": "...", "name": "...", "email": "..." } }
```

## AI

### `POST /ai/generate` 🔒

```json
{ "prompt": "Explain this in simple terms" }
```

Response:

```json
{ "result": "Gemini's answer as plain text" }
```

Errors: `401 { "error": "Unauthorized" }`, `500 { "error": "..." }`

---

## Adding endpoints (backend team)

1. Route in `src/routes/<name>.routes.js`, mount in `routes/index.js`.
2. Controller in `src/controllers/<name>.controller.js`.
3. Logic in `src/services/<name>.service.js`.
4. **Update this file** — the frontend consumes this contract.
