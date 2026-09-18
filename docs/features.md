# Feature Specifications

Complete specification for every feature in both backend and frontend.

---

## Backend Features

### Feature 1: Core Energy Optimization Pipeline (Judge-Facing)

**Priority**: P0 (Must have for preliminary round)  
**Endpoint**: `POST /optimize-energy`  
**Auth**: None (public)

#### Description
The core pipeline that receives a 24-hour energy scenario + operator notes and returns both the LLM interpretation and the optimized schedule. This is what the judge harness tests.

#### Processing Flow
```
Request → Validate Input → LLM Interpret Notes → Guardrail Validate → LP Optimize → Replay Validate → Response
```

#### Sub-components

**1.1 Request Validation** (`validators/energy.validator.js`)
- Validate `scenario_id` is non-empty string
- Validate `operator_notes` is array of 1-3 non-empty strings
- Validate `hours` is exactly 24 entries with unique hours 0-23
- Validate each hour has positive finite `demand_kwh`, `solar_kwh`, `tariff_bdt_per_kwh`
- Validate `battery` has all required positive fields
- Validate `initial_energy_kwh` is within [minimum, capacity]
- Return 400 with specific field errors on failure

**1.2 LLM Interpreter** (`services/interpreter.service.js`)
- Build a structured prompt with:
  - The list of supported directive types and their schemas
  - The operator notes as numbered inputs
  - Instructions to output JSON array of interpretations
- Call Gemini API with `responseMimeType: "application/json"`
- Parse response with `JSON.parse` in try-catch
- On parse failure: fallback all notes to `no_op`
- Retry up to 3 times on Gemini API errors

**1.3 Guardrail Validator** (`services/guardrail.service.js`)
- Check `note_index` 1:1 mapping to input notes
- Check `directive_type` is in allowed enum
- Check `hours` arrays: unique ints 0-23, ascending order
- Check `applies` semantics: `no_op` must be `false`, all others `true`
- Check `structured_adjustment` shape matches directive type:
  - `solar_reduction`: `{ hours: int[], factor: [0,1] }`
  - `minimum_battery_reserve`: `{ hours: int[], minimum_energy_kwh: >= 0 }`
  - `no_charge_window`: `{ hours: int[] }`
  - `no_discharge_window`: `{ hours: int[] }`
  - `max_grid_window`: `{ hours: int[], max_grid_kwh: >= 0 }`
  - `no_op`: `null`
- On validation failure: attempt to fix (sort hours, clamp factor), or fallback to `no_op`

**1.4 LP Optimizer** (`services/optimizer.service.js`)
- Build LP model with `javascript-lp-solver`:
  - **Variables**: For each hour h (0-23): `grid_h`, `solar_h`, `charge_h`, `discharge_h`
  - **Objective**: Minimize SUM(grid_h * tariff_h)
  - **Constraints per hour**:
    - Energy balance: grid_h + solar_h + discharge_h = demand_h + charge_h
    - Solar cap: solar_h <= effective_solar_h
    - Charge cap: charge_h <= max_charge_per_hour
    - Discharge cap: discharge_h <= max_discharge_per_hour
    - Battery state: min_energy <= E_after_h <= capacity
    - Battery chain: E_after_h = E_after_{h-1} + charge_h - discharge_h
  - **Directive constraints**:
    - `solar_reduction`: effective_solar_h = solar_h * factor for listed hours
    - `minimum_battery_reserve`: E_after_h >= max(base_min, directive_min)
    - `no_charge_window`: charge_h = 0
    - `no_discharge_window`: discharge_h = 0
    - `max_grid_window`: grid_h <= max_grid_kwh
  - **End-of-day**: E_after_23 = initial_energy
- Determine `battery_action` per hour: charge if charge_h > 0, discharge if discharge_h > 0, else idle
- Handle infeasible result gracefully

**1.5 Schedule Replay Validator** (`services/validator.service.js`)
- Replay the 24 hours independently:
  - Verify energy balance each hour (tolerance 0.01)
  - Verify battery state chain
  - Verify battery bounds
  - Verify charge/discharge limits
  - Verify solar_used <= effective_solar
  - Verify directive compliance
  - Verify battery neutrality (E_after_23 = initial)
- Recompute and verify totals: total_grid_kwh, total_cost_bdt, peak_grid_kwh

**1.6 Response Assembly**
- Build JSON response per Section 10 of the problem statement
- Generate `plan_summary` using LLM (optional, can be template-based for speed)

#### Error Handling
- Input validation error -> 400
- LLM timeout/failure -> retry 3x, then 500
- Infeasible LP -> 500 with message "Optimization infeasible"
- Replay validation failure -> 500 with message "Schedule validation failed"

---

### Feature 2: Health Check

**Priority**: P0  
**Endpoint**: `GET /health`  
**Auth**: None

Returns `{ "status": "ok" }` with HTTP 200 when the server is running.

---

### Feature 3: Authentication (Better Auth)

**Priority**: P1 (Needed for dashboard)  
**Endpoints**: `/api/auth/*` (managed by Better Auth)

#### Sub-features
- **Sign up**: email + password + name
- **Sign in**: email + password
- **Sign out**: clear session cookie
- **Get session**: return current user/session

#### Implementation
- Better Auth wildcard handler at `router.all("*", toNodeHandler(auth))`
- MongoDB adapter stores user/session/account collections
- Session cookie with `httpOnly`, `secure` in production
- `requireAuth` middleware checks session on protected routes

---

### Feature 4: Scenario Management (CRUD)

**Priority**: P2 (Dashboard feature)  
**Endpoints**: `/api/scenarios`  
**Auth**: Required

#### Operations
- **Create**: Save a new scenario with user-given name
- **List**: Paginated list of user's scenarios (newest first)
- **Get**: Single scenario by ID (must belong to current user)
- **Update**: Partial update of scenario fields
- **Delete**: Remove scenario (must belong to current user)

#### Authorization
- All operations scoped to `req.user.id`
- Users cannot access other users' scenarios

---

### Feature 5: Dashboard Optimization (Auth + Save)

**Priority**: P2  
**Endpoint**: `POST /api/energy/optimize`  
**Auth**: Required

Same as the judge-facing `POST /optimize-energy` pipeline, but:
- Requires authentication
- Accepts camelCase payload (frontend convention)
- Saves the result to `optimization_results` collection
- Links to user via `userId`
- Tracks `processingTimeMs`

---

### Feature 6: Optimization History

**Priority**: P2  
**Endpoints**: `/api/history`  
**Auth**: Required

#### Operations
- **List**: Paginated history of optimization runs with filtering and sorting
- **Detail**: Full result including hourly plan and interpretations

---

### Feature 7: Dashboard Statistics

**Priority**: P3  
**Endpoint**: `GET /api/dashboard/stats`  
**Auth**: Required

#### Aggregations (MongoDB aggregation pipeline)
- Total runs count
- Successful vs failed counts
- Average cost across successful runs
- Best (lowest) cost
- Average processing time
- Total saved scenarios count

---

### Feature 8: AI Chat (General Purpose)

**Priority**: P3  
**Endpoint**: `POST /api/ai/generate`  
**Auth**: Required

Generic Gemini prompt -> response. Already implemented.

---

## Frontend Features

### Feature 1: Authentication (`features/auth/`)

**Pages**: `/login`, `/signup`  
**Priority**: P1

#### Components
- `LoginForm`: Email + password inputs, sign-in button, link to signup
- `SignupForm`: Name + email + password inputs, sign-up button, link to login
- `AuthGuard`: Wraps protected pages, redirects to `/login` if not authenticated

#### Hooks
- `useAuth()`: Returns `{ session, user, isLoading, signIn, signUp, signOut }`

#### User Flows
1. **Sign Up**: Fill form -> submit -> auto-redirect to dashboard
2. **Sign In**: Fill form -> submit -> redirect to dashboard
3. **Sign Out**: Click logout -> redirect to login
4. **Auto-redirect**: Unauthenticated user hits `/dashboard` -> redirected to `/login`

#### Edge Cases
- Show field-level validation errors (email format, password min length)
- Show server errors (duplicate email, wrong password)
- Disable submit button while loading
- Trim email before sending

---

### Feature 2: Scenario Optimizer (`features/optimize/`)

**Page**: `/optimize`  
**Priority**: P1

#### Components
- `ScenarioForm`: Master form that orchestrates all sub-components
- `HourlyDataTable`: Editable table with 24 rows (hour, demand, solar, tariff)
  - Pre-filled with sample data
  - Inline editing with number inputs
  - Row-level validation (positive numbers)
- `BatteryConfigCard`: Card with 5 battery parameter inputs
  - Validation: capacity >= minimum, initial within [min, capacity]
- `OperatorNotesInput`: 1-3 textarea inputs for operator notes
  - Add/remove note buttons (min 1, max 3)
  - Character limit display
- `QuickTemplateSelector`: Dropdown to load one of the 10 public sample cases

#### Hooks
- `useOptimize()`: Mutation hook that calls `POST /api/energy/optimize` and handles loading/error/success states

#### User Flows
1. User lands on `/optimize`
2. Optionally selects a template to pre-fill the form
3. Edits hourly data, battery config, and operator notes
4. Clicks "Optimize" button
5. Loading state shown (with progress indicator)
6. On success: redirected to `/results/[id]` to view results
7. On error: inline error message displayed

#### Edge Cases
- Form validation before submit (all fields required, positive numbers)
- Handle API timeout (show retry button)
- Prevent double-submit while loading
- Persist form state in sessionStorage (don't lose data on accidental navigation)
- Large table scroll on mobile (horizontal scroll)

---

### Feature 3: Results Viewer (`features/results/`)

**Pages**: `/results` (list), `/results/[id]` (detail)  
**Priority**: P1

#### Components
- `ResultSummaryCard`: Shows scenario_id, total cost, total grid, peak grid, processing time, status
- `DirectiveInterpretationCard`: For each note — shows note text, directive type badge, applies/no_op badge, hours, numeric values, explanation
- `HourlyPlanTable`: 24-row table showing grid, solar, battery action, battery kWh, battery energy after
- `EnergyChart`: Stacked area chart (x=hour, y=kWh) showing grid_kwh, solar_used_kwh, battery contribution
- `BatteryStateChart`: Line chart showing battery_energy_after_kwh across 24 hours with capacity and minimum lines
- `CostBreakdownChart`: Bar chart showing hourly cost (grid_kwh * tariff)

#### Hooks
- `useResult(id)`: Fetch single optimization result
- `useHistory()`: Fetch paginated history list

#### User Flows
1. `/results` page: shows list of past runs with summary info
2. Click a run -> navigate to `/results/[id]`
3. Detail page shows full interpretation, plan, and charts
4. User can compare cost across runs from the list view

#### Edge Cases
- Empty state when no results yet
- Error state when result not found (404)
- Loading skeletons for charts
- Responsive chart sizing
- Handle "infeasible" and "error" status results differently

---

### Feature 4: Dashboard Overview (`features/dashboard/`)

**Page**: `/dashboard`  
**Priority**: P2

#### Components
- `StatsCards`: Grid of stat cards (total runs, success rate, avg cost, best cost, avg time)
- `RecentRunsList`: Last 5 optimization runs with quick links
- `CostTrendChart`: Line chart showing cost over time (last N runs)

#### Hooks
- `useDashboardStats()`: Fetch stats from `GET /api/dashboard/stats`

#### Edge Cases
- Empty state for new users (0 runs)
- Stats loading skeleton
- Handle API errors gracefully

---

### Feature 5: Shared UI (`features/shared/`)

**Priority**: P0 (used by all features)

#### Components
- `Sidebar`: Navigation with links to Dashboard, Optimize, Results, Settings
  - Active state highlighting
  - Collapsible on mobile
- `Topbar`: User avatar, name, sign-out button
- `LoadingSpinner`: Full-page and inline variants
- `ErrorBoundary`: Catches rendering errors, shows fallback UI
- `EmptyState`: Illustrated empty state for lists
- `ToastProvider`: Success/error toast notifications

#### Shared Hooks
- `useApi()`: Base fetch wrapper that includes credentials and base URL

#### Shared Lib
- `api.js`: Axios/fetch instance configured with `baseURL` and `credentials: "include"`
- `constants.js`: Directive types, battery actions, route paths

---

### Feature 6: Settings Page

**Page**: `/settings`  
**Priority**: P3

- Display user profile (name, email)
- (Future: change password, notification preferences)

---

## Feature Priority Summary

| Priority | Backend | Frontend |
|---|---|---|
| P0 | Energy optimization pipeline, Health check | Shared UI components |
| P1 | Authentication, Scenario management | Auth, Optimizer form, Results viewer |
| P2 | Dashboard optimization, History, Stats | Dashboard overview |
| P3 | AI Chat | Settings |
