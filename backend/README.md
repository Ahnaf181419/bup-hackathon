# Backend — Express API

## Setup

```bash
# create .env (gitignored) - see the variable table in the root README
npm install
npm run dev
```

Server runs on `http://localhost:3001`.

## Environment variables

| Var                | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `PORT`             | HTTP port (default 3001)                   |
| `MONGO_URI`        | MongoDB Atlas connection string            |
| `GEMINI_API_KEY`   | Google AI Studio API key                   |
| `CORS_ORIGIN`      | Allowed frontend origin (comma-separated)  |

## Structure

```
src/
├── server.js        # entry — DB connect + listen
├── app.js           # express app — CORS, routes, error handler
├── config/          # env, db, gemini client, operator id
├── routes/          # URL -> controller mapping (all under /api)
├── controllers/     # request handling, response shaping
├── services/        # business logic (Gemini calls, DB operations)
├── models/          # Mongoose schemas
├── middlewares/     # auth guard, validation, error handler
└── utils/           # logger, asyncHandler
```

## Request flow

`routes -> controller -> service -> model`

- Controllers never touch Gemini or Mongo directly.
- Services never touch `req`/`res`.
- All routes are prefixed `/api` — see `../docs/api-contract.md`.
