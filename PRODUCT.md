# Product

## Register

product

## Users

Primary: **BUP CSE Fest 2026 hackathon judges**, evaluating a live demo — they watch an
optimization run end-to-end, probe whether operator directives were interpreted correctly,
and score trust, clarity, and craft in minutes. Secondary: the persona the UI plays to —
a **campus energy operator** dispatching a microgrid day-ahead: loading a scenario, typing
natural-language notes, running the solver, auditing the 24-hour plan.

Context of use: single-operator workstation, dark control-room environment, dense numeric
data on screen for extended reading sessions.

## Product Purpose

**GridWise** is an LLM-assisted 24-hour campus microgrid dispatch engine. Input: day-ahead
demand/solar/tariff forecast, battery parameters, and 1–3 free-text operator directives.
Output: a cost-optimal hourly charge/discharge/grid plan that provably honors every
directive. Success looks like: a judge or operator *trusts* the directive interpretation,
*verifies* the plan against constraints without effort, and *remembers* the product.

## Brand Personality

"**Neon Control Room**" — precise, alive, engineered. The room hums; the instruments are
exact. Lime is current (actions, selection, success); neutrals carry the layout; data
colors are fixed per physical quantity. Calm power over loud energy.

## Anti-references

- **Generic AI dark slop** — same-y dark dashboard, gradient text, glow-everything,
  identical card grids.
- **Cyberpunk saturation** — neon borders, scanlines everywhere, Tron perspective floors
  inside app pages.
- **Corporate flatness** — admin-template grays with no atmosphere or identity.
- **Motion noise** — parallax on data, pulsing while reading, scroll-hijacks.

## Design Principles

1. **The atmosphere spends the decoration budget.** Ambient world-building (grid,
   blooms, pulse) runs below the attention threshold; components above it stay calm —
   no pulsing cards, no shimmering KPIs.
2. **Data colors are semantic, never decorative.** Solar is amber, grid is cyan,
   battery is emerald — in charts, tables, and nowhere else.
3. **Motion conveys state above the threshold, identity below it.** 150–250 ms
   eased feedback for interactions; minutes-long ambient drift for the world.
4. **Every surface teaches the pipeline.** Directive in → interpretation out →
   constrained plan. Screens explain what the solver did and why it can be trusted.

## Accessibility & Inclusion

- WCAG AA: body text ≥ 4.5:1 on its surface; large text ≥ 3:1.
- `prefers-reduced-motion`: all ambient and interaction motion freezes at safe static
  end-states (pulse invisible, grid seamless, blooms at home).
- Visible lime `:focus-visible` outline on all interactive elements.
- Tabular numerics for all data readouts.
