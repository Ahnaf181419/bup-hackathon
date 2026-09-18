# GridWise UI Implementation Plan — "Neon Control Room"

> Status: **Approved** · Branch: `dev` · Register: **product** (design serves the task, showcase moments earned)
> Skills applied: `impeccable` (product discipline, state systems), `high-end-visual-design` ($150k agency craft — double-bezel, haptic micro-interactions), `gpt-taste` (cinematic motion, AIDA landing).

---

## 1. Concept & Art Direction

**Identity (preserved):** Dark control-room theme + electric lime accent (`#a3e635`), Geist Sans/Mono, recharts, lucide-react.

**Elevation — "Neon Control Room":** Ethereal-glass architecture on deepest black, ambient lime mesh-glow atmosphere, machined double-bezel cards, physics-based motion. Glow is a **tiered system**, not decoration soup:

| Tier | Token | Usage |
|---|---|---|
| Ambient | `--glow-ambient` | Resting luminescence on hero/key cards only |
| Hover | `--glow-hover` | Interactive spotlight + border bloom |
| Focus | `--glow-focus` | Focus-visible rings, active states |

**Scene sentence:** *A campus energy operator reviews tonight's 24-hour dispatch plan in a dim control room, focused and time-boxed — the interface should feel like a premium SCADA console, not a SaaS template.*

**Scene sentence (landing):** *A judge opens the URL for the first time on a projector — the page must land like a title card, not a login redirect.*

---

## 2. Locked Decisions

- Direction: **refine dark-lime identity**, elevate to premium showpiece (user: "must look like a $10,000 project")
- Scope: **demo-critical first** (optimize → results → shell), then breadth, then landing
- Styling: **token CSS + classes** (no Tailwind, no CSS-in-JS)
- Motion library: **`motion`** (framer-motion's React-19/Next-16 package) — the ONLY new dependency
- Landing page: **build it** (replaces redirect at `src/app/page.js`)
- Icons: lucide-react at `strokeWidth={1.5}` (ultra-light refinement, no new icon lib)

---

## 3. Hard Guardrails (all phases)

1. **GPU-safe:** animate `transform` + `opacity` only. Never `top/left/width/height`.
2. **`backdrop-blur` only on fixed/sticky elements** (nav, overlays, floating bar). Never on scrolling content.
3. **Glow never sacrifices contrast.** Body text ≥ 4.5:1. `--text-muted` must be bumped until AA on card bg.
4. **`prefers-reduced-motion`** fallback for every animation (crossfade or instant).
5. **One easing system:** `--ease-expo: cubic-bezier(0.32, 0.72, 0, 1)`. Zero `linear`, zero default `ease-in-out`.
6. **Task-speed motion in-app:** 200–400ms inside workflows; 600–800ms reserved for reveals/results/landing showcase moments.
7. **Single visual vocabulary:** same button/card/badge/table system on every screen. If the "save" button looks different in two places, one is wrong.
8. **No banned patterns:** no gradient text, no identical card grids, no cheap meta-labels ("SECTION 01"), no display fonts in UI labels.
9. **Noise/grain only on fixed, `pointer-events-none` layers.**
10. **Z-index scale:** `--z-nav < --z-sticky-bar < --z-overlay < --z-modal < --z-toast < --z-tooltip`. No arbitrary `9999`.

---

## 4. Phase-by-Phase Execution

### Step 0 — Gate (before any code)
- [ ] Read `frontend/node_modules/next/dist/docs/` for Next-16 breaking changes (per `frontend/AGENTS.md` warning: APIs/conventions/file structure may differ from training data)
- [ ] `npm install motion` in `frontend/`

### Phase 0 — Foundation (tokens + atmosphere)
**Files:** `src/app/globals.css` (rewritten as importer) → `src/styles/tokens.css`, `src/styles/components.css`, `src/styles/motion.css`

**Atmosphere layers (fixed, GPU-cheap):**
- Dual radial mesh glows: lime 7% opacity top-left, cyan 4% bottom-right
- SVG-noise grain overlay (feTurbulence data-URI, opacity 0.03, `pointer-events-none`)
- Slow-drifting grid pattern (60s loop, pausable under reduced-motion)

**Token work:**
- Deepened bg ramp: `#05070a` app → `#0a0f16` surface → `#0e1520` card (current: `#080c11`/`#0f151e`/`#131b27`)
- Glow tiers (section 1)
- Fixed type scale (ratio ~1.16): `0.69 / 0.75 / 0.81 / 0.875 / 1 / 1.125 / 1.375 / 1.75rem` + display sizes for landing (2.5–5rem, clamp)
- Weight discipline: max 700; Geist Mono for data readouts
- Spacing scale: 4/8/12/16/24/32/48/64
- State tokens: `--state-hover`, `--state-focus`, `--state-disabled`, semantic success/warning/error/info
- Contrast fix: `--text-muted` ≥ 4.5:1 on `--bg-card`

**Double-bezel primitives:**
```css
.shell { padding: 1.5–2px; border-radius: var(--radius-xl); ring(white/10); bg(white/3) }
.core  { border-radius: calc(shell − 6px); bg surface;
         box-shadow: inset 0 1px 1px rgba(255,255,255,0.06) }
```

**Component classes (replace inline styles):** buttons (primary/secondary/ghost × hover/focus/active/disabled/loading), form controls + error states, cards, badges, tables (sticky header, tabular-nums), modal, skeletons, teaching empty states.

### Phase 1 — Motion kit
**Files:** `src/features/shared/motion/`

| File | Purpose |
|---|---|
| `Reveal.jsx` | `whileInView` fade-up + blur-resolve, 700ms, staggered container variants |
| `CountUp.jsx` | Spring-animated numbers, tabular-nums, formats kWh/BDT |
| `SpotlightCard.jsx` | Cursor-tracked radial glow via CSS vars (`--mx/--my`, no re-renders) |
| `MagneticButton.jsx` | Magnetic pull + nested icon-circle physics + `active scale 0.98` |
| `PageTransition.jsx` | AnimatePresence route fade/slide, 250ms |
| `chartTheme.js` | Recharts color tokens, unified glass tooltip, axis/legend styles |
| `CustomCursor.jsx` | Hybrid "targeting reticle" cursor — see spec below |

#### Custom Cursor — "Targeting Reticle" (implemented)

**Hybrid mode (usability resolution):**

| Surface | Behavior |
|---|---|
| Landing (`/`) | Full reticle — dot + spring ring + 4 crosshair ticks, native cursor hidden |
| App (`/dashboard/*`) | Native cursor kept + trailing ambient lime halo (spring-lagged) |

**Contextual states:** hover interactive → ring expands + glow brightens · over text inputs/table cells → condenses to lime I-beam caret · busy (pipeline running) → spinning arc inside ring + halo pulse.

**Engineering:** `useMotionValue` + `useSpring` (300/30) — zero re-renders, transform/opacity only · outer motion anchor owns x/y, inner elements own scale/appearance so CSS transitions never fight motion · `mix-blend-mode: screen` halo · enabled on `(pointer: fine)` only · fully unmounted under `prefers-reduced-motion` · native cursor suppression gated to `body[data-cursor-surface="landing"]` scope only · z-index `--z-cursor: 90` (above toast in the app layer scale) · eases via `--cursor-ease: var(--ease-out)`.

**Integration API:**
```js
import { setCursorBusy, setCursorMode } from "@/features/shared/motion/CustomCursor";
setCursorBusy(true);          // while optimization pipeline runs (Phase 3 wires this)
setCursorMode("reticle");     // manual override for demos/video; "auto" restores pathname-based
```

Files: `src/features/shared/motion/CustomCursor.jsx`, `src/styles/motion.css` (imported first from `globals.css`), mounted in `src/app/providers.jsx`.

### Phase 2 — App shell
- `Navbar.jsx` — floating double-bezel glass pill; sliding active indicator (`motion layoutId`); `aria-current="page"`; brand glow pulse on logo mark only
- `AIAssistantDrawer.jsx` — spring slide-in (x-physics), staggered messages, typing dots, ambient-pulse trigger

### Phase 3 — Optimize (hero workflow)
- `ScenarioForm.jsx` — remove all 23 inline-style blocks → classes; left column as bevel cards; header actions with MagneticButton
- `HourlyDataTable.jsx` — sticky header + sticky hour column; glow-focus cells; 24-row entry stagger at 30ms/row (fast, task-speed)
- Floating action bar — glass, live count-up summary metrics (demand/solar/battery/directives)
- **`OptimizationProgressModal.jsx` — the signature moment:**
  - AnimatePresence scale/fade entry
  - Connecting line that fills between stages as they complete
  - Spring icon-pops per stage; live mono "terminal readout" line
  - Success state: check morph + soft glow ripple (no confetti)
  - Stages mirror the real backend pipeline: **LLM Interpret → Guardrail → LP Solve → Verify**

### Phase 4 — Result detail (money screen)
- `ResultSummaryCard.jsx` — count-up metrics (cost, grid kWh, peak), reference-comparison badges
- `DirectiveInterpretationCard.jsx` — per-note cards, type badge, hour chips animating in, status icons
- Charts (`EnergyDispatchChart`, `BatteryStateChart`, `CostBreakdownChart`):
  - Shared `chartTheme` (tokens, not hex)
  - `syncId="plan"` crosshair sync across all charts
  - 800ms draw-in on mount
  - **BatteryStateChart ReferenceLines:** capacity ceiling, minimum floor, directive reserve floors — constraints become visible proof
- `HourlyPlanTable.jsx` — unified table system

### Phase 5 — Breadth surfaces
- `StatsCards.jsx` — asymmetrical bento (1 hero metric + 3 satellites, not identical grid), count-ups
- `RecentRunsList.jsx` — staggered reveal, spotlight hover rows
- `QuickRunPromptCard.jsx` — system styling
- History list — filter bar, rows, teaching empty state
- `LoginForm` / `SignupForm` — centered double-bezel auth card on mesh atmosphere
- Settings — clean form treatment

### Phase 6 — Cinematic landing (replaces `src/app/page.js` redirect)
AIDA structure, cinematic chapters (`py-32`+ rhythm):
1. **Attention:** glass nav → wide cinematic hero (H1 ≤ 3 lines, `max-w-5xl`), animated grid + mesh backdrop, two nested-arrow CTAs
2. **Interest:** pipeline bento — LLM Interpret / Guardrail / LP Solver / Verifier as 4 asymmetrical bevel cards
3. **Desire:** sample-case strip / live metrics with count-ups
4. **Action:** high-contrast CTA + clean footer
- "Enter Console" → `/dashboard`

### Phase 7 — Verification
- [ ] Dev-server screenshots at 1440 / 1024 / 390 px — every surface
- [ ] Keyboard + focus-visible pass
- [ ] `prefers-reduced-motion` check
- [ ] Contrast audit (glow vs text)
- [ ] `npm run lint && npm run build` clean
- [ ] Full demo-flow run: landing → optimize (SAMPLE-01) → progress modal → results → charts sync

---

## 5. Backend/UI Coordination Notes (out of scope, flagged)
These backend issues affect the UI story and should be fixed separately:
1. `structured_adjustment` schema mismatch (`window`/`reserve_floor_kwh` vs judge-expected `hours`/`minimum_energy_kwh`/`max_grid_kwh`)
2. `gemini-3.6-flash` model name validity; battery params missing from interpret prompt
3. Hardcoded fallback phrases + invented `[12,13]` windows in guardrail
4. `test-pipeline.js` external path, 3/10 coverage
5. Fake dashboard stats fallback (`scenarioCount: 10`)
