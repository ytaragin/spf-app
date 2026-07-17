# SPF App — Automated Testing

## What This Is

`spf-app` is a Vue 3 single-page application that simulates a football game: users pick play types, assign lineups, and run plays against an authoritative REST backend that returns new game state. This milestone adds an **automated testing layer** (unit, component, and E2E) to a codebase that currently has zero tests, establishing repeatable quality gates for the existing app and future work.

## Core Value

A trustworthy, fast local test suite that gives developers confidence to change the app without breaking existing gameplay — starting with the highest-value pure domain logic and extending up through stores, components, and core end-to-end flows.

## Requirements

### Validated

<!-- Inferred from existing codebase (.planning/codebase/). These already ship and work. -->

- ✓ Vue 3 SPA with Vuetify UI, Pinia state, and vue-router (`/`, `/game`) — existing
- ✓ Domain layer: `SPFMetadata`, `TeamData`, `playOutcome` pure JS in `src/game/` — existing
- ✓ Backend-authoritative play flow: type → lineup → run → result via axios REST calls — existing
- ✓ Static quality gates: `npm run lint` (ESLint) and `npm run format` (Prettier) — existing
- ✓ Unit tests for Pinia stores (`gameStore`, `teamStore`) with mocked axios, covering error branches — Validated in Phase 3: Store Unit Tests (86 tests passing; reusable factories in `test/factories/`)

### Active

<!-- This testing milestone. Hypotheses until shipped and validated. -->

- [ ] Vitest test runner configured for the Vite + Vue 3 stack (reusing the `@` → `src` alias, jsdom environment)
- [ ] Unit tests for the domain layer (`src/game/` pure functions) — highest-value priority target
- [ ] Component tests for key Vue SFCs via `@vue/test-utils` + jsdom + Vuetify
- [ ] Playwright E2E for core user flows, supporting both mocked-API (hermetic, default) and real-backend runs
- [ ] Coverage reporting via `@vitest/coverage-v8` (report-only, no enforced threshold)
- [ ] `npm` scripts for running unit, component, and E2E tests locally

### Out of Scope

- **CI integration (GitHub Actions)** — deferred; this milestone is local-only. Revisit once the suite is stable.
- **Enforced coverage thresholds** — report-only for now; avoids blocking work before baseline coverage exists.
- **Exhaustive coverage of every function/component** — target is infra + meaningful coverage of priority targets, not 100%.
- **Backend test suite** — the REST backend is a separate concern; only the client app is in scope.
- **Refactoring existing app code** (e.g. extracting an `src/api/` client) — noted as tech debt but not part of this milestone; tests target current code as-is.

## Context

- **Current test state:** Phase 3 complete — 86 passing tests across domain (`src/game/`), gameStore, and teamStore suites, plus reusable factories in `test/factories/`. No CI yet (per `.planning/codebase/TESTING.md`, still local-only).
- **Stack:** Vite + Vue 3 (Composition API, `<script setup>`), Vuetify, Pinia (setup stores), axios, vue-router.
- **Idiomatic choice:** Vitest (shares Vite's transform pipeline) + `@vue/test-utils` + jsdom; Playwright for E2E.
- **Prioritized test targets** (from codebase map): (1) `src/game/playOutcome.js` — pure, no mocking; (2) `src/stores/gameStore.js` — mock axios + fresh Pinia per test; (3) components — need Vuetify plugin + jsdom.
- **Backend authority:** every play round-trips to `VITE_API_BASE_URL`; E2E must handle both a real backend and route-mocked responses.
- **Known tech debt (not in scope):** inline axios transport in stores, `getHardCodedValue()` scaffold, duplicated per-call error handling.

## Constraints

- **Tech stack**: Vitest + `@vue/test-utils` + jsdom + `@vitest/coverage-v8` for unit/component; Playwright for E2E — because they align with the existing Vite/Vue 3 toolchain.
- **Compatibility**: Test config must reuse the existing `@` → `src` alias from `vite.config.js`; Vuetify components require a `createVuetify()` plugin instance when mounted.
- **Dependencies**: E2E against a real backend depends on backend availability and a valid `VITE_API_BASE_URL`; mocked-API mode must run with no backend.
- **Scope discipline**: Add tests against current code without refactoring app source.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Vitest for unit/component tests | Shares Vite config/transform; idiomatic for Vue 3 + Vite | — Pending |
| Use Playwright for E2E | Modern, fast, strong trace tooling; current default for new Vue/Vite projects | — Pending |
| E2E supports both mocked-API and real-backend | Backend-authoritative app; mocked = hermetic/fast, real = truest signal | — Pending |
| Local-only (no CI) this milestone | Establish a stable suite first; add CI later | — Pending |
| Coverage report-only (no threshold) | Avoid blocking work before baseline coverage exists | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-17 after Phase 3 (Store Unit Tests) completion*
