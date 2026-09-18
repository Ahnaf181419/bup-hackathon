# EnergiQ — Smart Campus Energy Optimization (GridWise LLM)

BUP CSE Fest 2026 Hackathon · Online Preliminary.

EnergiQ plans a campus microgrid's next 24 hours: when to import from the grid, how much solar to use, and when to charge or discharge the battery, at minimum grid cost. Operators write free-text notes such as *"Panels are washed noon–2 PM, only 25% of solar usable"*. An **LLM** turns each note into a structured directive, **deterministic guardrails** check it, an **exact LP optimizer** solves the schedule, and a **replay validator** checks the plan against every rule before it is returned.

Team: **[Team Name]** — Members: [Name 1], [Name 2], [Name 3]

---

## Architecture

```
POST /optimize-energy
   │
   ├─ 1. Request validation ─────── 400 malformed/structural · 422 impossible battery values
   │
   ├─ 2. LLM interpretation ─────── Gemini, JSON-schema output, temperature 0, battery params in prompt
   │        │                        returns type + start/end hours + values as stated (e.g. "50% of capacity")
   │        └─ timeout, retry, fallback model; cache + in-flight dedupe
   │
   ├─ 3. Guardrails (deterministic) ─ whitelist types, expand windows in code, convert units in code,
   │        │                          range-check values, exact output shapes, one entry per note
   │        └─ note rejected / LLM down → deterministic backup parser (same guardrails) → else no_op
   │
   ├─ 4. LP optimizer ───────────── javascript-lp-solver, minimize Σ grid × tariff
   │
   └─ 5. Replay validator ───────── balance, solar, battery bounds/rates/transitions, directives,
                                     end-of-day energy, totals recomputed from hourly_plan
```

| Layer | Code |
|---|---|
| Judge endpoints | `backend/src/app.js`, `backend/src/controllers/energy.controller.js` |
| Request validation | `backend/src/validators/energy.validator.js` |
| LLM interpreter | `backend/src/services/interpreter.service.js` |
| Guardrails | `backend/src/services/guardrail.service.js` |
| Backup parser (fallback only) | `backend/src/services/fallbackParser.service.js` |
| Optimizer | `backend/src/services/optimizer.service.js` |
| Replay validator | `backend/src/services/validator.service.js` |
| Dashboard UI (optional, not judged) | `frontend/` (Next.js) |

### LLM role

- **Provider/model:** Google Gemini via `@google/genai`. The primary model is `GEMINI_MODEL` (default `gemini-3.1-flash-lite`). `GEMINI_FALLBACK_MODEL` (default `gemini-3.5-flash-lite`) is tried when the primary is rate-limited, slow or unavailable.
- **One call per scenario** covers all notes. It uses structured JSON output (response schema) at `temperature: 0`, and minimal thinking where the model supports it.
- The model returns `directive_type`, `windows: [{start_hour, end_hour}]`, and values *as stated* (`usable_solar_fraction`, `reserve_kwh` or `reserve_percent_of_capacity`, `max_grid_kwh`).
- **Code does the arithmetic:** it expands windows (start inclusive, end exclusive, wrapping past midnight) and converts percentages of capacity into kWh.
- If the model rejects a config option (HTTP 400), the interpreter steps down a config ladder and remembers the working level for that model.

### Guardrails

- Allowed types only: `solar_reduction`, `minimum_battery_reserve`, `no_charge_window`, `no_discharge_window`, `max_grid_window`, `no_op`.
- Exactly one entry per note, with `note_index` running 0..N-1 in order.
- `no_op` ⇒ `applies: false`, `structured_adjustment: null`. Every other type ⇒ `applies: true` with this exact shape:
  - `solar_reduction` `{hours, factor}`, where `0 ≤ factor ≤ 1` and factor is the fraction that **remains** usable.
  - `minimum_battery_reserve` `{hours, minimum_energy_kwh}`, where `0 ≤ kWh ≤ capacity`.
  - `no_charge_window` / `no_discharge_window` `{hours}`.
  - `max_grid_window` `{hours, max_grid_kwh}`, where `kWh ≥ 0`.
- `hours` are unique integers 0–23 in ascending order and never empty.
- **Missing values are never invented.** A directive without a valid window or number is rejected, re-read by the backup parser and, failing that, becomes `no_op`.
- Overlapping directives resolve to the strictest value: lowest factor, highest reserve, lowest grid cap.
- Base demand, tariff and battery parameters are never modified.

### Optimizer (LP formulation)

For each hour *h*, the variables are `grid, solar_used, charge, discharge ≥ 0` and `E` (battery energy after the hour).

- minimize `Σ grid[h] · tariff[h]`
- `grid + solar_used + discharge − charge = demand`
- `solar_used ≤ solar · factor[h]`
- `E[h] = E[h−1] + charge − discharge`, with `E[−1] = initial_energy_kwh`
- `max(minimum_energy_kwh, reserve[h]) ≤ E[h] ≤ capacity_kwh`
- `charge ≤ max_charge` (0 in no-charge hours), `discharge ≤ max_discharge` (0 in no-discharge hours)
- `grid ≤ max_grid_kwh` in capped hours
- `E[23] = initial_energy_kwh` (end-of-day neutrality)

Post-processing nets charge and discharge into a single `battery_action` per hour (`idle` ⇒ `battery_kwh = 0`). It carries battery energy forward from the rounded actions and recomputes grid from the balance. All totals are computed from the returned `hourly_plan`. If no plan can satisfy the constraints, the API returns **422**.

---

## Quick start (local)

Requires Node.js ≥ 20.

```bash
git clone <repo-url> && cd <repo>/backend
# create backend/.env with the variables below (at minimum GEMINI_API_KEY); it is gitignored
npm install
npm start                     # http://localhost:3001
```

### Environment variables (`backend/.env`, names only — never commit values)

Minimal `backend/.env`:

```bash
GEMINI_API_KEY=your-key-here
```

Everything else has a default:

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes (for LLM) | Gemini API key. Without it the service still answers using the backup parser only. |
| `GEMINI_MODEL` | no | Primary model (default `gemini-3.1-flash-lite`) |
| `GEMINI_FALLBACK_MODEL` | no | Second model on quota/timeout (default `gemini-3.5-flash-lite`; empty disables) |
| `LLM_TIMEOUT_MS` / `LLM_TOTAL_BUDGET_MS` | no | Per-call timeout (default 9000) and total LLM budget per request (default 15000) |
| `HOST` / `PORT` | no | Bind address (default `0.0.0.0`) and port (default `3001`) |
| `MONGO_URI`, `CORS_ORIGIN` | no | Dashboard only (run history, chat history). The judged endpoints never use them. There is no login or authentication. |

### Try it

```bash
curl -s http://localhost:3001/health
# {"status":"ok"}

node -e 'const d=require("../docs/problem/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");console.log(JSON.stringify(d.cases[0].input))' \
  | curl -s -X POST http://localhost:3001/optimize-energy -H 'content-type: application/json' -d @-
```

### Tests

```bash
cd backend
npm run test:samples            # all 10 public cases through the full pipeline (uses Gemini if configured)
npm run test:samples:offline    # same, forcing the backup parser (no network)
BASE_URL=http://localhost:3001 npm run test:api   # HTTP contract + robustness (400/422, no leaks)
```

`test:samples` checks each interpretation against the reference (type, hours, numbers). It replays each plan against our directives and against the reference directives, and requires cost ≤ the reference optimum. Expected result: `10/10 passed`. Both `test:samples:offline` and `test:api` (14/14) currently pass.

---

## Docker

```bash
# Build
docker build -t <dockerhub-user>/gridwise-backend:<tag> ./backend

# Run (secrets are passed at runtime, never baked into the image)
docker run -d -p 3001:3001 -e GEMINI_API_KEY=... <dockerhub-user>/gridwise-backend:<tag>
curl http://localhost:3001/health
```

- **Published image:** `TODO: <registry>/<image>:<exact-tag or @sha256 digest>`
- **Port:** `3001`, bound to `0.0.0.0`.
- `backend/.dockerignore` excludes `.env`, and the image copies only `package*.json` and `src/`.
- **Full stack** (MongoDB + backend + dashboard): `docker compose up --build`. Variables are read from a root `.env`.

**Public endpoint:** `TODO: https://...` (always-on host).

---

## Dependencies & credits

- **Backend:** express, cors, dotenv, @google/genai, javascript-lp-solver, mongoose (dashboard history only)
- **Frontend (optional dashboard):** Next.js, React, Recharts, lucide-react
- **LLM:** Google Gemini
- **AI tools used during development:** Claude Code (Anthropic), Lovable

## Known limitations

- Interpretation quality depends on the LLM. The backup parser handles common phrasings but not every paraphrase. It never invents a directive; when unsure it returns `no_op`.
- A note that implies several constraints is mapped to its single primary directive, since the contract allows one entry per note.
- Genuinely infeasible directive combinations return 422 rather than a partial plan.
- The dashboard (`/api/*`, MongoDB) is a convenience for demos. It is not part of the judged API.

## Secret handling

- `.env` files are gitignored and excluded from Docker builds. Only variable **names** appear in this repo.
- Error responses never include stack traces or internal messages. Details are logged server-side only.
- If a secret is ever exposed, rotate it immediately (Gemini key in Google AI Studio, database password in Atlas).
