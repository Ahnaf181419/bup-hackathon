# GridWise LLM — Hackathon Checklist

Source of truth: `docs/problem/` (Problem Statement = contract, Participant Guide = scoring/deployment).
Round window: **7:00 PM – 11:00 PM (4 hours)**.

Scoring (100 pts): LLM interpretation 25 · Directive application & constraints 25 ·
Optimization quality 10 · API contract 10 · Performance 10 · Deployment & Docker 10 ·
Docs & reproducibility 10. Video = tie-break only.

---

## 0. Repo & cleanup

- [ ] Repo created **after** question reveal, kept **private** during event, made **public** after deadline
- [ ] Remove MongoDB / Better Auth / user routes from the startup path (server must not exit if DB is missing)
- [ ] `server.js` listens on `0.0.0.0` and `PORT` env var
- [ ] `.env` never committed; `.env.example` lists every variable name with no values
- [ ] Error handler returns a generic message on 500 — no stack traces, no `err.message` leaks, no secrets in logs

## 1. API contract (exact names)

- [ ] `GET /health` → HTTP 200 `{"status":"ok"}`, ready within 60 s of start
- [ ] `POST /optimize-energy` at the root path (NOT under `/api`)
- [ ] Malformed JSON → **400** (controlled JSON error body)
- [ ] Structurally invalid request → **400**; semantically invalid → **422** (optional)
- [ ] Internal failure → **500** with generic message
- [ ] Request validation:
  - [ ] `scenario_id` string
  - [ ] `operator_notes` array of **1–3 non-empty strings**
  - [ ] `hours` exactly **24** entries, unique `hour` 0–23 (sort by `hour` before use)
  - [ ] each hour has finite numbers `demand_kwh`, `solar_kwh`, `tariff_bdt_per_kwh`
  - [ ] `battery` has `capacity_kwh`, `initial_energy_kwh`, `minimum_energy_kwh`, `max_charge_kwh_per_hour`, `max_discharge_kwh_per_hour`
- [ ] Response top-level fields: `scenario_id` (echoed), `directive_interpretation`, `hourly_plan`, `total_grid_kwh`, `total_cost_bdt`, `peak_grid_kwh`, `plan_summary`

## 2. LLM interpretation (mandatory — must feed the optimizer)

- [ ] LLM is in the note → directive path (not just `plan_summary`) — **disqualification otherwise**
- [ ] Keyword/regex matching is **only a fallback**, never the sole interpreter
- [ ] One LLM call for all notes of a scenario; JSON/structured output mode; temperature 0
- [ ] Prompt includes battery parameters (for "50% of capacity" style notes) and the 6 allowed types with examples
- [ ] LLM returns start/end hours; **code** expands to hours array (start inclusive, end exclusive)
  - [ ] "1 PM to 3 PM" → `[13,14]`; "noon" = 12; "midnight" end = 24; "13:00–15:00"; "from one until three"
  - [ ] wrap-around windows (e.g. 10 PM – 2 AM) → `[0,1,22,23]`
- [ ] Solar: `factor` = **fraction remaining** ("80% reduction" → 0.2, "one-fifth" → 0.2, "half" → 0.5)
- [ ] Reserve: "% of capacity" converted in code → kWh (SAMPLE-03: 50% of 200 → 100)
- [ ] Distractors (cafeteria, library, club notices, next week/next month) → `no_op`
- [ ] Paraphrase robustness tested (PV / panel washing / inverter work / charger isolated / feeder limit / substation / transformer)
- [ ] Cache interpretations by note text + battery params (speed + stability)
- [ ] LLM timeout (~10 s) + one retry, then fallback parser

## 3. Guardrails (deterministic, before optimizer)

- [ ] Exactly one entry per note, `note_index` 0..N-1 in order, no duplicates/missing
- [ ] `directive_type` ∈ {`solar_reduction`, `minimum_battery_reserve`, `no_charge_window`, `no_discharge_window`, `max_grid_window`, `no_op`}
- [ ] `no_op` ⇒ `applies:false`, `structured_adjustment:null`
- [ ] every other type ⇒ `applies:true` and exact shape:
  - [ ] `solar_reduction` → `{hours, factor}` with 0 ≤ factor ≤ 1
  - [ ] `minimum_battery_reserve` → `{hours, minimum_energy_kwh}` finite, ≥ 0, ≤ capacity
  - [ ] `no_charge_window` / `no_discharge_window` → `{hours}`
  - [ ] `max_grid_window` → `{hours, max_grid_kwh}` finite, ≥ 0
- [ ] `hours` unique ints 0–23, ascending, non-empty
- [ ] No extra keys in `structured_adjustment`
- [ ] Invalid/unsupported LLM output → controlled handling (retry → fallback → `no_op`), **never crash, never invent a type**
- [ ] Never modify base demand, tariff, or battery parameters
- [ ] Every entry has a short `explanation` string

## 4. Optimizer (LP)

Variables per hour h: `grid[h]`, `solar_used[h]`, `charge[h]`, `discharge[h]`, `E[h]` (energy after hour).

- [ ] Objective: minimize Σ `grid[h] × tariff[h]`
- [ ] Energy balance: `grid + solar_used + discharge = demand + charge`
- [ ] `0 ≤ solar_used ≤ effective_solar` (= solar × factor in reduced hours)
- [ ] `E[h] = E[h-1] + charge − discharge`, `E[-1] = initial_energy_kwh`
- [ ] `max(min_energy, reserve_directive[h]) ≤ E[h] ≤ capacity`
- [ ] `charge ≤ max_charge`, `discharge ≤ max_discharge`
- [ ] `no_charge_window` → charge = 0; `no_discharge_window` → discharge = 0
- [ ] `max_grid_window` → `grid ≤ max_grid_kwh`
- [ ] **End-of-day neutrality: `E[23] = initial_energy_kwh`**
- [ ] Multiple directives of same type on same hour → take the strictest (min factor, max reserve, min grid cap)
- [ ] Post-process: net simultaneous charge+discharge into one action (lossless battery)
- [ ] `battery_action` ∈ {charge, discharge, idle}; idle ⇒ `battery_kwh = 0`
- [ ] Round carefully (clean tiny floats like 1e-9 → 0); recompute `grid` from balance so it holds exactly; no negatives
- [ ] Infeasible LP → controlled response (422 / safe error), never a crash

## 5. Final validator (replay our own plan before responding)

- [ ] 24 unique hours 0–23
- [ ] all numbers finite and ≥ 0
- [ ] battery transitions, bounds, rate limits
- [ ] solar used ≤ effective solar
- [ ] energy balance every hour (tol 0.01)
- [ ] final battery energy = initial
- [ ] every directive obeyed (reserve / no-charge / no-discharge / grid cap)
- [ ] `total_grid_kwh`, `total_cost_bdt`, `peak_grid_kwh` computed **from the returned hourly_plan**
- [ ] `plan_summary` short human-readable string

## 6. Testing

- [ ] Script runs all 10 cases in `BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json`
- [ ] Compare interpretation (type, hours, numbers) with expected
- [ ] Compare our cost with reference `total_cost_bdt` (must be ≤ reference + 0.01)
- [ ] Run validator on each returned plan
- [ ] Paraphrased notes test set (write our own variants)
- [ ] Robustness: malformed JSON, missing fields, 23 hours, 0 or 4 notes, empty note, LLM key missing/invalid, LLM down
- [ ] Repeated requests: no 5xx, stable output
- [ ] Latency: p95 ≤ **5 s** (full points), hard limit 30 s
- [ ] Test deployed URL from **outside** our machine

## 7. Deployment & Docker

- [ ] `Dockerfile` (Node 20/22 slim), binds `0.0.0.0`, exposes documented port, **no secrets baked in**
- [ ] `.dockerignore` excludes `.env`, `node_modules`
- [ ] Image pushed to Docker Hub / GHCR with **exact tag or digest**
- [ ] Verified `docker pull` + `docker run -p ... -e GEMINI_API_KEY=... <image>` → `/health` ok
- [ ] Public endpoint on an **always-on** host (avoid free tiers that sleep / cold-start)
- [ ] No login, VPN, or manual approval needed to reach it
- [ ] LLM key has enough quota / rate limit for repeated hidden tests; consider backup model

## 8. README (10 pts — rubric checklist)

- [ ] Project overview + LLM → guardrails → optimizer → validator architecture
- [ ] Copy-paste local quickstart from clean clone (install, env, run)
- [ ] Environment-variable names (no values)
- [ ] Model/provider identifier (e.g. Gemini model name) and the LLM's role
- [ ] Guardrails list
- [ ] Optimizer/solver used (library + formulation)
- [ ] Exact run command
- [ ] `curl` for `/health` and `/optimize-energy` with a public sample
- [ ] Public-sample test command + expected result
- [ ] Docker pull/run instructions with exact image tag
- [ ] Dependencies & credits (all libraries, AI tools used)
- [ ] Known limitations
- [ ] Secret-handling note

## 9. Submission package

- [ ] 1. Working public base URL
- [ ] 2. GitHub repo link (public after deadline)
- [ ] 3. README & configuration
- [ ] 4. Docker image reference (tag/digest), env var names, port, verified run command
- [ ] 5. ≤ 3-minute video: problem, architecture, LLM → guardrails → optimizer flow, how to run/test

## 10. Final pre-submit (from rubric)

- [ ] `/health` reachable, returns `{"status":"ok"}`
- [ ] `/optimize-energy` reachable externally, accepts 1–3 notes with exact schema
- [ ] One interpretation entry per note, correct `applies`/`no_op` semantics and shapes
- [ ] LLM output guardrailed before optimization
- [ ] `hourly_plan` obeys directives + energy balance + solar + battery + rate + grid cap + end-of-day rules
- [ ] Totals match recalculation from `hourly_plan`
- [ ] README complete, no committed secrets
- [ ] Endpoint, Docker image, and video links stay accessible through judging
