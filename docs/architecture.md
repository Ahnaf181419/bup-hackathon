# Architecture

Stack: React (Lovable) · Express · MongoDB Atlas · Better Auth · Google Gemini

```
┌─────────────┐     /api/*        ┌──────────────┐        ┌──────────────┐
│   React     │ ───────────────▶ │   Express    │ ─────▶ │ MongoDB      │
│  (Lovable)  │ ◀─────────────── │   backend    │ ◀───── │ Atlas        │
└─────────────┘   JSON + cookie  └──────┬───────┘        └──────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Google Gemini│
                                 └──────────────┘
```

## Layering rules

```
routes → controllers → services → models / gemini
```

- **routes** — URL routing only, attach middleware
- **controllers** — read request, call service, shape response
- **services** — business logic, Gemini calls, DB operations
- **models** — Mongoose schemas
- **middlewares** — `errorHandler` (there is no authentication)
- **config** — env, db connection, Gemini client, fixed operator id

## Backend tree

```
backend/src/
├── server.js                 # entry — DB connect, listen
├── app.js                    # express app — CORS, /health, /api, errors
├── config/{env,db,gemini,operator}.js
├── routes/{index,ai,energy,history,dashboard,scenario}.routes.js
├── controllers/{ai,energy,history,dashboard,scenario}.controller.js
├── services/{gemini,prompt}.service.js
├── models/{Scenario,OptimizationResult,ChatMessage,index}.js
├── middlewares/{auth,validate,errorHandler}.js
└── utils/{logger,asyncHandler}.js
```

## Auth flow

1. React calls Better Auth client (`/api/auth/sign-up`, `/sign-in`...).
2. Better Auth on Express validates, stores user/session in MongoDB.
3. Session cookie returned; `credentials: "include"` on all fetches.
4. No route requires login; dashboard data is stored under one fixed operator id.

## Key decisions

- Mongoose over native driver — schemas + validation for free
- Better Auth session cookies — clean SPA + Express fit
- Gemini accessed only from `services/gemini.service.js`
- API key lives only in backend env, never in frontend
