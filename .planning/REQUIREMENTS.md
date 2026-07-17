# Requirements: SPF App — Automated Testing

**Defined:** 2026-07-13
**Core Value:** A trustworthy, fast local test suite that gives developers confidence to change the app without breaking existing gameplay — starting with the highest-value pure domain logic and extending up through stores, components, and core end-to-end flows.

## v1 Requirements

Requirements for the initial testing milestone. Each maps to roadmap phases.

### Foundation

- [x] **FND-01**: Project builds and runs on an upgraded Vite version compatible with a maintained Vitest release (Vite 4 → 6 prerequisite), verified by `npm run build` and `npm run dev`
- [x] **FND-02**: Vitest is configured for the app, reusing the existing `@` → `src` alias and a DOM environment (jsdom/happy-dom) with globals enabled
- [x] **FND-03**: A shared test setup file registers Vuetify (`createVuetify()`) and provides required jsdom shims (ResizeObserver, matchMedia, CSS.supports)
- [x] **FND-04**: Coverage reporting is available via `@vitest/coverage-v8` with `all: true` (report-only, no enforced threshold)
- [x] **FND-05**: `npm` scripts exist to run tests once, in watch mode, with coverage, and to run E2E tests

### Domain Unit Tests

- [x] **DOM-01**: `src/game/playOutcome.js` pure functions are unit-tested (classify/color/summary/turnover/possession logic), no mocking
- [x] **DOM-02**: `src/game/SPFMetadata.js` box↔position mapping and label helpers are unit-tested
- [x] **DOM-03**: `src/game/TeamData.js` roster model (assign/reset/availability) is unit-tested

### Store Unit Tests

- [x] **STO-01**: `gameStore` play-flow actions are tested with a fresh Pinia per test and mocked axios (setPlayType, setLineup, setOffensivePlay/DefensivePlay, runPlay)
- [x] **STO-02**: `gameStore` error-handling branches set `error` and reset loading flags on failed API calls
- [x] **STO-03**: `teamStore` player/lineup logic (fetchPlayers, selectPlayer, managed-team toggle) is tested with mocked axios
- [x] **STO-04**: Reusable game-state/player test fixtures/factories exist and are shared across store, component, and E2E-mock tests

### Component Tests

- [x] **CMP-01**: `PlayResult.vue` renders outcome color/icon/label correctly from store/props via `@vue/test-utils` + Vuetify
- [ ] **CMP-02**: At least one interaction/flow component (e.g. `GameLayout.vue` or a play selector) is tested with seeded Pinia state
- [x] **CMP-03**: Component tests mount successfully with the Vuetify plugin and jsdom shims (no unresolved-component or missing-global failures)

### End-to-End Tests

- [ ] **E2E-01**: Playwright is configured with a `webServer` that starts the Vite app for tests
- [ ] **E2E-02**: A core play flow (start game → pick type → assign lineup → run play → see result) is covered by a hermetic E2E test using route mocking (default, no backend required)
- [ ] **E2E-03**: E2E hermetic mocks return full-shape `new_state` payloads and use web-first assertions / `waitForResponse` (no hard waits)
- [ ] **E2E-04**: E2E can toggle to run against a real backend via an env var + `VITE_API_BASE_URL` (mocked mode is the default)

## v2 Requirements

Deferred to a future milestone. Tracked but not in current roadmap.

### Continuous Integration

- **CI-01**: GitHub Actions workflow runs unit/component tests on push and PR
- **CI-02**: GitHub Actions runs Playwright E2E (hermetic mode) in CI
- **CI-03**: Coverage report published/surfaced from CI

### Coverage Enforcement

- **COV-01**: Enforced coverage thresholds fail the build below a target percentage

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-backend E2E on every run | Backend-authoritative app; hermetic mocking is the default. Real-backend is an opt-in toggle, not the norm |
| Snapshot-testing every component | Brittle, low-signal; prefer behavioral assertions |
| Chasing / enforcing 100% coverage | Report-only this milestone; target is meaningful coverage of priority targets |
| Testing scaffold/dead code (`getHardCodedValue()`, unused `counter.js`) | Not real surface area; documented tech debt |
| Over-mocking pure `src/game/` functions | They are dependency-free — test directly |
| Refactoring app source (e.g. extracting `src/api/`) | Tests target current code as-is; refactor is separate tech debt |
| Backend REST API test suite | Separate concern; only the client app is in scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| FND-02 | Phase 1 | Complete |
| FND-03 | Phase 1 | Complete |
| FND-04 | Phase 1 | Complete |
| FND-05 | Phase 1 | Complete |
| DOM-01 | Phase 2 | Complete |
| DOM-02 | Phase 2 | Complete |
| DOM-03 | Phase 2 | Complete |
| STO-01 | Phase 3 | Complete |
| STO-02 | Phase 3 | Complete |
| STO-03 | Phase 3 | Complete |
| STO-04 | Phase 3 | Complete |
| CMP-01 | Phase 4 | Complete |
| CMP-02 | Phase 4 | Pending |
| CMP-03 | Phase 4 | Complete |
| E2E-01 | Phase 5 | Pending |
| E2E-02 | Phase 5 | Pending |
| E2E-03 | Phase 5 | Pending |
| E2E-04 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 19 total
- Mapped to phases: 19 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after initial definition*
