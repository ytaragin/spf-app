# Phase 5: End-to-End Tests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 05-end-to-end-tests
**Areas discussed:** Play-flow scope & route coverage, webServer boot strategy, Real-backend env toggle design, Fixture shape & landing-page inclusion

---

## Play-flow scope & route coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Full journey from landing | Start at LandingPage → /game, mock fetchPlayers, fetchGame/state, nexttype, offense/call, game/play, game/plays | ✓ |
| Start at /game only | Skip landing/team-loading mocks, only mock in-game play flow | |

**User's choice:** Full journey from landing (Recommended)
**Notes:** Covers the realistic full journey, not just an in-game slice.

---

## Play depth

| Option | Description | Selected |
|--------|-------------|----------|
| Single play only | Cover exactly one successful play round-trip | |
| Two plays chained | Chain a second play to prove state continuity (next play type, history growth) | ✓ |

**User's choice:** Two plays chained
**Notes:** Deviates slightly from E2E-02's literal "a play" wording — deliberate choice to prove statefulness.

---

## webServer boot strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Vite dev server | Playwright webServer runs `npm run dev` | ✓ |
| Build + preview | `npm run build && npm run preview` | |

**User's choice:** Vite dev server (Recommended)
**Notes:** Fast startup, no build step needed before every E2E run.

---

## Real-backend env toggle design

| Option | Description | Selected |
|--------|-------------|----------|
| E2E_MODE env var, default mocked | Single `E2E_MODE` env var, default unset/mocked | |
| Project/tag split via CLI flag | Playwright `projects` array, selected via `--project=live` | ✓ |

**User's choice:** Project/tag split via CLI flag
**Notes:** Follow-up clarification confirmed this still satisfies E2E-04 because the `live` project reads `VITE_API_BASE_URL` for its target — see CONTEXT.md D-06 for the reconciliation note flagged to the planner.

---

## Live mode skip

| Option | Description | Selected |
|--------|-------------|----------|
| Single test file, branches by mode | Same play-flow test file branches on route-mock setup | ✓ |
| Two separate test files | Independent hermetic and live test files | |

**User's choice:** Single test file, branches by mode (Recommended)

---

## Fixture shape & landing-page inclusion

| Option | Description | Selected |
|--------|-------------|----------|
| Separate e2e/fixtures/ | Playwright-specific fixtures, independent of test/factories/ | ✓ |
| Reuse test/factories/ directly | Use Vitest factories as Playwright route response bodies | |

**User's choice:** Separate e2e/fixtures/ (Recommended)
**Notes:** `test/factories/` builds plain JS objects for Pinia state, not full HTTP response bodies — different shape/purpose.

---

## the agent's Discretion

- Playwright config file structure (single config with `projects` array vs. more granular)
- How mocked-vs-live branching is implemented inside the single test file
- Naming of `e2e/fixtures/` files and E2E spec file(s)

## Deferred Ideas

None — discussion stayed within phase scope.
