# Retrospective: SPF App

A living retrospective across milestones. Newest milestone sections are added above the Cross-Milestone Trends section.

## Milestone: v1.0 — Automated Testing

**Shipped:** 2026-07-18
**Phases:** 5 | **Plans:** 10 | **Tasks:** 13

### What Was Built

Added a complete automated testing layer to a Vue 3 SPA that had zero tests:

- **Foundation:** Upgraded Vite 4 → 6 (hard prerequisite for a maintained Vitest), configured Vitest with the `@`→`src` alias, jsdom, a shared Vuetify/jsdom setup file, `@vitest/coverage-v8` (report-only), and npm scripts for run/watch/coverage/E2E.
- **Domain unit tests:** Mock-free coverage of `playOutcome.js` (19 tests), `SPFMetadata.js`, and `TeamData.js` (10 tests).
- **Store unit tests:** Reusable backend-shaped factories in `test/factories/`, `gameStore` suite (24 tests, exhaustive error branches + finally-reset assertions), `teamStore` suite (7 tests) — 86-test suite green with no Pinia leakage.
- **Component tests:** `PlayResult.vue` and `PlayTypeSelector.vue` mounted against real Pinia + real Vuetify with zero stubs.
- **E2E:** Playwright configured with a `webServer`; a hermetic route-mocked play-flow spec (default, offline) plus an opt-in real-backend project.

### What Worked

- **Strict dependency cone** (foundation → domain → store → component → E2E) meant each layer built on proven infrastructure below it — no rework from bottom-up surprises.
- **Shared factories established early (Phase 3)** paid off across store, component, and E2E-mock layers.
- **Zero-stub component tests** with real Vuetify/Pinia gave high-confidence, low-brittleness coverage.
- **Full-shape `new_state` E2E fixtures** avoided `undefined`-render false failures.

### What Was Inefficient

- The Vite 4 → 6 upgrade was a blocking prerequisite discovered at the start; had it surfaced during initial scoping, Phase 1 could have been framed as an upgrade phase from the outset.
- A Vuetify CSS import initially broke Vitest module resolution (Phase 1 blocker) — cost some setup iteration.

### Patterns Established

- `test/factories/` for reusable backend-shaped fixtures (buildGameState/buildLineup/buildPlayer/buildRoster).
- Fresh Pinia per test; mock axios at the module boundary.
- Component tests use the real Vuetify plugin + jsdom shims (ResizeObserver, matchMedia, CSS.supports), no stubbing.
- E2E: hermetic route-mocking is the default; real backend is an explicit opt-in project, not the norm.

### Key Lessons

- Verify toolchain compatibility (Vite/Vitest version matrix) before committing to a test-runner choice.
- Document domain bugs as tech debt (ISSUES.md) rather than silently asserting current — possibly wrong — behavior as correct (done for two `SPFMetadata.js` bugs).

### Deferred to Future Milestones

- CI (GitHub Actions) for unit/component + E2E (CI-01..03).
- Enforced coverage thresholds (COV-01).
- Refactoring inline axios transport out of stores into an `src/api/` client.

### Cost Observations

- Model mix: not tracked this milestone.
- Notable: ~1,082 LOC of test code delivered across 10 plans; 86 unit/component tests + hermetic E2E play-flow.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 Automated Testing | 5 | 10 | 2026-07-18 |
