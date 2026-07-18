# SPF App

## What This Is

`spf-app` is a Vue 3 single-page application that simulates a football game: users pick play types, assign lineups, and run plays against an authoritative REST backend that returns new game state. As of v1.0 the app is backed by an **automated testing layer** (Vitest unit/component + Playwright E2E) covering the domain layer, Pinia stores, key components, and the core play flow.

## Current State

**Shipped:** v1.0 — Automated Testing (2026-07-17)

A trustworthy, fast local test suite is in place: ~86 Vitest tests across `src/game/` domain modules, `gameStore`/`teamStore`, and key components (`PlayResult`, `PlayTypeSelector`), plus a hermetic Playwright E2E play-flow spec with an opt-in real-backend mode. Coverage is report-only (no enforced threshold). No CI yet (local-only by design).

## Core Value

A trustworthy, fast local test suite that gives developers confidence to change the app without breaking existing gameplay — starting with the highest-value pure domain logic and extending up through stores, components, and core end-to-end flows.

## Requirements

### Validated

<!-- Inferred from existing codebase (.planning/codebase/). These already ship and work. -->

- ✓ Vue 3 SPA with Vuetify UI, Pinia state, and vue-router (`/`, `/game`) — existing
- ✓ Domain layer: `SPFMetadata`, `TeamData`, `playOutcome` pure JS in `src/game/` — existing
- ✓ Backend-authoritative play flow: type → lineup → run → result via axios REST calls — existing
- ✓ Static quality gates: `npm run lint` (ESLint) and `npm run format` (Prettier) — existing
- ✓ Vitest configured for Vite + Vue 3 (`@`→`src` alias, jsdom, Vuetify setup, coverage-v8, npm scripts) — v1.0
- ✓ Domain-layer unit tests (`playOutcome`, `SPFMetadata`, `TeamData`) with zero mocking — v1.0
- ✓ Pinia store unit tests (`gameStore`, `teamStore`) with mocked axios + reusable factories, covering error branches — v1.0
- ✓ Component tests (`PlayResult.vue`, `PlayTypeSelector.vue`) via `@vue/test-utils` + real Vuetify/Pinia — v1.0
- ✓ Playwright E2E of the core play flow — hermetic route-mocked default + opt-in real-backend mode — v1.0

### Active

<!-- Next milestone. Hypotheses until shipped and validated. -->

- [ ] (Defined in next milestone via `/gsd-new-milestone`)

### Out of Scope

- **CI integration (GitHub Actions)** — deferred; this milestone is local-only. Revisit once the suite is stable.
- **Enforced coverage thresholds** — report-only for now; avoids blocking work before baseline coverage exists.
- **Exhaustive coverage of every function/component** — target is infra + meaningful coverage of priority targets, not 100%.
- **Backend test suite** — the REST backend is a separate concern; only the client app is in scope.
- **Refactoring existing app code** (e.g. extracting an `src/api/` client) — noted as tech debt but not part of this milestone; tests target current code as-is.

## Context

- **Current test state:** v1.0 shipped — ~86 Vitest tests (domain + stores + components) all green, plus a hermetic Playwright E2E play-flow spec (~1,082 LOC of test code). Reusable factories in `test/factories/`. Coverage report-only; no CI (local-only by design).
- **Stack:** Vite 6 + Vue 3 (Composition API, `<script setup>`), Vuetify, Pinia (setup stores), axios, vue-router. Testing: Vitest + `@vue/test-utils` + jsdom + `@vitest/coverage-v8`; Playwright for E2E.
- **Backend authority:** every play round-trips to `VITE_API_BASE_URL`; E2E handles both a real backend and route-mocked responses (mocked is the default).
- **Known tech debt (not addressed in v1.0):** inline axios transport in stores, `getHardCodedValue()` scaffold, duplicated per-call error handling, two documented bugs in `SPFMetadata.js` (recorded during Phase 2, not fixed).

## Constraints

- **Tech stack**: Vitest + `@vue/test-utils` + jsdom + `@vitest/coverage-v8` for unit/component; Playwright for E2E — because they align with the existing Vite/Vue 3 toolchain.
- **Compatibility**: Test config must reuse the existing `@` → `src` alias from `vite.config.js`; Vuetify components require a `createVuetify()` plugin instance when mounted.
- **Dependencies**: E2E against a real backend depends on backend availability and a valid `VITE_API_BASE_URL`; mocked-API mode must run with no backend.
- **Scope discipline**: Add tests against current code without refactoring app source.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Vitest for unit/component tests | Shares Vite config/transform; idiomatic for Vue 3 + Vite | ✓ Good — 86 tests green, fast |
| Use Playwright for E2E | Modern, fast, strong trace tooling; current default for new Vue/Vite projects | ✓ Good — hermetic play-flow spec passing |
| E2E supports both mocked-API and real-backend | Backend-authoritative app; mocked = hermetic/fast, real = truest signal | ✓ Good — project-based mocked/live switch |
| Local-only (no CI) this milestone | Establish a stable suite first; add CI later | — Pending (deferred to v2 CI-01..03) |
| Coverage report-only (no threshold) | Avoid blocking work before baseline coverage exists | ✓ Good |
| Upgrade Vite 4 → 6 as a hard prerequisite | No maintained Vitest supports Vite 4 | ✓ Good — unblocked all test tooling |
| Full-shape `new_state` E2E mock fixtures | Prevent `undefined`-render false failures | ✓ Good — fixtures carry all 9 gameState fields |

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
*Last updated: 2026-07-17 after v1.0 (Automated Testing) milestone*
