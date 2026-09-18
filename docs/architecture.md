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
- **middlewares** — `requireAuth` (Better Auth session), `errorHandler`
- **config** — env, db connection, Gemini client, Better Auth instance

## Backend tree

```
backend/src/
├── server.js                 # entry — DB connect, listen
├── app.js                    # express app — CORS, /health, /api, errors
├── config/{env,db,gemini,auth}.js
├── routes/{index,auth,ai,user}.routes.js
├── controllers/{ai,user}.controller.js
├── services/{gemini,prompt}.service.js
├── models/{User,index}.js
├── middlewares/{auth,validate,errorHandler}.js
└── utils/{logger,asyncHandler}.js
```

## Auth flow

1. React calls Better Auth client (`/api/auth/sign-up`, `/sign-in`...).
2. Better Auth on Express validates, stores user/session in MongoDB.
3. Session cookie returned; `credentials: "include"` on all fetches.
4. Protected routes go through `requireAuth` middleware.

## Key decisions

- Mongoose over native driver — schemas + validation for free
- Better Auth session cookies — clean SPA + Express fit
- Gemini accessed only from `services/gemini.service.js`
- API key lives only in backend env, never in frontend
