# [Project Name] — BUP Hackathon

> One-line pitch: [What it does, for whom, and why]

Team: **[Team Name]**
Members: [Name 1], [Name 2], [Name 3]

## Stack

| Layer     | Tech                                      |
| --------- | ----------------------------------------- |
| Frontend  | React (built with Lovable)                |
| Backend   | Node.js + Express                         |
| Database  | MongoDB Atlas (Mongoose)                  |
| Auth      | Better Auth (email/password + sessions)   |
| AI        | Google Gemini                             |

## Repo layout

```
backend/    Express API — auth, AI, DB
frontend/   React app (generated via Lovable)
docs/       Idea, API contract, auth wiring, demo script
assets/     Logos, pitch deck, demo media
```

## Quick start

### Backend

```bash
cd backend
cp .env.example .env    # fill in real values
npm install
npm run dev             # starts on http://localhost:3001
```

### Frontend

See `frontend/README.md` for the Lovable workflow and how to wire the
API base URL + Better Auth client.

## Docs

- `docs/idea.md` — problem, solution, MVP scope
- `docs/api-contract.md` — every endpoint the frontend consumes
- `docs/better-auth-setup.md` — auth wiring guide for the React app
- `docs/demo-script.md` — judging demo flow
- `docs/architecture.md` — frozen architecture reference
