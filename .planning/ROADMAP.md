# Roadmap: SPF App — Automated Testing

**Created:** 2026-07-13
**Granularity:** standard
**Core Value:** A trustworthy, fast local test suite that gives developers confidence to change the app without breaking existing gameplay — starting with the highest-value pure domain logic and extending up through stores, components, and core end-to-end flows.

This roadmap follows a strict dependency cone: foundation → domain → store → component → E2E. Phase 1 is a hard gate (nothing runs until the Vite upgrade + runner config land); each higher layer depends on the infrastructure below being proven.

## Phases

- [x] **Phase 1: Test Foundation** - Upgrade Vite 4→6, install and configure Vitest + coverage + shared setup, prove with one trivial test (completed 2026-07-13)
- [x] **Phase 2: Domain Unit Tests** - Unit-test pure `src/game/` logic (playOutcome, SPFMetadata, TeamData) with zero mocking (completed 2026-07-14)
- [x] **Phase 3: Store Unit Tests** - Test Pinia stores with fresh Pinia + mocked axios + error branches, establish shared factories (completed 2026-07-17)
- [ ] **Phase 4: Component Tests** - Mount key SFCs with Vuetify + jsdom shims + seeded Pinia
- [ ] **Phase 5: End-to-End Tests** - Playwright hermetic play-flow (mock default) + env-gated real-backend toggle

## Phase Details

### Phase 1: Test Foundation

**Goal**: Developers have a working, idiomatic Vitest test runner wired into the (upgraded) Vite toolchain, ready to run tests locally.
**Mode:** mvp
**Depends on**: Nothing (first phase — hard gate)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. `npm run build` and `npm run dev` succeed on the upgraded Vite 6 (+ matching Vue plugins) with no source refactor
  2. `npm test` runs Vitest, resolves `@` → `src`, uses a DOM environment with globals, and reports at least one passing trivial domain test
  3. `npm run test:coverage` produces a report-only V8 coverage summary with `all: true` over `src/**` (no enforced threshold)
  4. A shared `test/setup.js` registers `createVuetify()` and jsdom shims (ResizeObserver, matchMedia, CSS.supports) and loads without error
  5. `npm` scripts exist for run-once, watch, coverage, and E2E entry points

**Plans**: 1/1 plans complete

- [x] 01-01-PLAN.md — Vite 4→6 upgrade + Vitest/jsdom/coverage config + shared setup + proving test (FND-01..05)

### Phase 2: Domain Unit Tests

**Goal**: The highest-value pure domain logic in `src/game/` is locked down by fast, mock-free unit tests.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DOM-01, DOM-02, DOM-03
**Success Criteria** (what must be TRUE):

  1. `playOutcome.js` functions (classify, color, summary, turnover, possession logic) are tested and pass green
  2. `SPFMetadata.js` box↔position mapping and label helpers are tested and pass green
  3. `TeamData.js` roster model (assign/reset/availability) is tested and pass green
  4. The domain suite runs with no mocks and no test-setup dependency, proving the runner independent of DOM infra

**Plans**: 3/3 plans executed

- [x] 02-01-PLAN.md — Expand playOutcome.test.js with full function coverage (DOM-01)
- [x] 02-02-PLAN.md — SPFMetadata.test.js + ISSUES.md tech-debt doc (DOM-02)
- [x] 02-03-PLAN.md — TeamData.test.js happy-path roster coverage (DOM-03)

**Cross-cutting constraints:**

- The domain suite runs with no mocks and no test-setup dependency

### Phase 3: Store Unit Tests

**Goal**: Pinia stores are tested with fresh state and mocked axios, covering both success and error UX, backed by reusable fixtures.
**Depends on**: Phase 2
**Requirements**: STO-01, STO-02, STO-03, STO-04
**Success Criteria** (what must be TRUE):

  1. `gameStore` play-flow actions (setPlayType, setLineup, setOffensivePlay/DefensivePlay, runPlay) are tested with a fresh Pinia per test and mocked axios
  2. `gameStore` failure paths set `error` and reset loading flags in `finally`, verified against the app's error-extraction shape
  3. `teamStore` player/lineup logic (fetchPlayers, selectPlayer, managed-team toggle) is tested with mocked axios
  4. Shared game-state/player factories exist in `test/factories/` and are consumed by the store suite
  5. The store suite passes run-together and in randomized order (no Pinia state leakage)

**Plans**: 3/3 plans executed
**Wave 1**

- [x] 03-01-PLAN.md — Shared test factories (buildGameState/buildLineup/buildPlayer/buildRoster) + smoke test (STO-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — gameStore suite: play-flow success + exhaustive error branches + finally resets (STO-01, STO-02)
- [x] 03-03-PLAN.md — teamStore suite: fetchPlayers + selectPlayer/removePlayer + managed-team toggle (STO-03)

### Phase 4: Component Tests

**Goal**: Key Vue SFCs render correctly from seeded store state when mounted with the full Vuetify + jsdom environment.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: CMP-01, CMP-02, CMP-03
**Success Criteria** (what must be TRUE):

  1. `PlayResult.vue` renders the correct outcome color, icon, and label from store/props via `@vue/test-utils` + Vuetify
  2. At least one interaction/flow component (e.g. `GameLayout.vue` or a play selector) is tested with seeded Pinia state
  3. Components mount cleanly with the Vuetify plugin and jsdom shims — no unresolved-component or missing-global failures
  4. Component tests reuse the shared factories from Phase 3 for seed data

**Plans:** 2/2 plans executed

Plans:

- [x] 04-01-PLAN.md — PlayResult.vue outcome-branch + empty-state component tests (CMP-01, CMP-03)
- [x] 04-02-PLAN.md — PlayTypeSelector.vue fetch + click-dispatch component tests (CMP-02, CMP-03)

**UI hint**: yes

### Phase 5: End-to-End Tests

**Goal**: The core play flow is covered end-to-end by a hermetic Playwright test that runs offline by default, with an opt-in real-backend mode.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04
**Success Criteria** (what must be TRUE):

  1. Playwright is configured with a `webServer` that boots the Vite app for tests
  2. The core play flow (start game → pick type → assign lineup → run play → see result) passes as a hermetic route-mocked test with no backend running
  3. Hermetic mocks return full-shape `new_state` payloads and use web-first assertions / `waitForResponse` (no hard waits)
  4. A single `E2E_MODE`/env switch (with `VITE_API_BASE_URL`) toggles the suite to run against a real backend, mocked mode being the default

**Plans**: 1/1 plans

- [ ] 05-01-PLAN.md — Playwright install/config (webServer + mocked/live projects) + full-shape fixtures + hermetic two-play E2E spec (E2E-01, E2E-02, E2E-03, E2E-04)


## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Test Foundation | 1/1 | Complete    | 2026-07-13 |
| 2. Domain Unit Tests | 2/3 | In Progress|  |
| 3. Store Unit Tests | 3/3 | Complete    | 2026-07-17 |
| 4. Component Tests | 2/2 | In Progress|  |
| 5. End-to-End Tests | 0/? | Not started | - |

---
*Roadmap created: 2026-07-13*
*Coverage: 19/19 v1 requirements mapped*
