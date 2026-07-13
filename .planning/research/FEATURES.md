# Feature Research

**Domain:** Automated test suite for a Vue 3 + Vite + Pinia SPA (backend-authoritative)
**Researched:** 2026-07-13
**Confidence:** HIGH

The "features" of this milestone are the *capabilities of a trustworthy test suite* — not app features. A capability is "table stakes" if its absence makes the suite untrustworthy or unusable; "differentiating" if it raises signal/velocity beyond the baseline; "anti-feature" if it's a common testing habit that adds cost without proportional value.

Stack facts driving these recommendations (from codebase map + `package.json`):
- Vite 4 / Vue 3.3 / Pinia 2 (setup stores) / Vuetify 3.6 / axios / vue-router 4.
- Zero existing tests; `@` → `src` alias in `vite.config.js` must be reused.
- Backend-authoritative: every play POSTs to `VITE_API_BASE_URL`; `gameState` is replaced wholesale from server `new_state`.
- Priority targets already ranked: (1) `src/game/playOutcome.js` pure fns, (2) `src/stores/gameStore.js` (axios + error branches), (3) components (need `createVuetify()`).

> Version note: Vite 4 pairs with **Vitest 1.x** (Vitest 2/3 expect Vite 5+). Pin Vitest to a 1.x line unless the Vite version is bumped. Confirm at install time — MEDIUM confidence on exact ceiling; the compatibility *direction* is HIGH.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these and the suite is not trustworthy or not usable day-to-day.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Vitest runner wired into Vite config (reuses `@`→`src` alias, jsdom env, `globals: true`) | Without a runner nothing runs; wrong alias/env = imports and component mounts fail | LOW | Reuse `vite.config.js` alias via `test:` block or `vitest.config.js` `mergeConfig`. jsdom required to mount SFCs. Pin Vitest to a Vite-4-compatible (1.x) line. |
| `npm` scripts: `test` (run once), `test:watch`, `test:coverage` | Standard entry points; CI-less local dev needs a one-shot and a watch loop | LOW | `vitest run`, `vitest`, `vitest run --coverage`. Matches TESTING.md recommendation. |
| Domain unit tests for `src/game/` pure functions | Highest logic density, zero mocking, the confidence floor | LOW | `playOutcome.js` (`isTurnover`, `netYards`, `outcomeColor`, `outcomeSummary`, `classifyOutcome`, `managedTeamHadPossession`), plus `SPFMetadata`/`TeamData` methods. Start here. |
| Fresh Pinia per test (`setActivePinia(createPinia())` in `beforeEach`) | Setup stores are singletons; stale state across tests = flaky, order-dependent failures | LOW | Non-negotiable for any store or component test that touches a store. |
| axios mocking for store tests (`vi.mock('axios')`) | All network lives inline in stores; real HTTP in unit tests = slow, non-hermetic, backend-coupled | MEDIUM | Mock `axios.get/post`. Assert both success and rejection paths. `import.meta.env.VITE_API_BASE_URL` may need stubbing. |
| Error-branch coverage in store tests | The app's error UX (snackbar via `gameStore.error`) is a real behavior; happy-path-only tests miss half the store | MEDIUM | Use `mockRejectedValueOnce`; assert `error` message extraction (`err.response.data ?? err.message`) and that `finally` resets `isSubmitting*` flags. |
| Vuetify plugin registration in component mounts | Vuetify components fail to resolve without a `createVuetify()` instance in `global.plugins` | MEDIUM | `mount(C, { global: { plugins: [vuetify, pinia] } })`. jsdom lacks layout APIs — some Vuetify measurement warnings are expected/benign. |
| Deterministic tests (no real time/network/random ordering) | Flaky tests destroy trust faster than having no tests | MEDIUM | Fake timers where needed; no live backend in unit/component layer; avoid asserting on non-deterministic server data. |
| Coverage reporting (`@vitest/coverage-v8`, report-only) | You can't target "meaningful coverage of priority targets" without seeing the numbers | LOW | Report-only, **no enforced threshold** (per PROJECT.md scope). `v8` provider matches the runtime; no Istanbul instrumentation needed. |
| Playwright E2E for the core play flow, mocked-API by default | A backend-authoritative app's real risk is the type→lineup→run→result round-trip; default runs must be hermetic (no backend) | HIGH | `page.route()` to stub `/game/*`, `/offense/*`, `/defense/*`, `/players/*`. Default `npm run test:e2e` needs no backend. |

### Differentiators (Competitive Advantage)

Higher-value capabilities that raise signal or velocity beyond the baseline.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hermetic E2E via route mocking as the default mode | Fast, reproducible, runs offline/anywhere; catches wiring/render regressions without backend flakiness | HIGH | Central place to define canned responses per endpoint. This is what makes E2E runnable in a local loop, not just on demand. |
| Real-backend E2E toggle (env-gated) | Truest end-to-end signal against the authoritative server when a backend + valid `VITE_API_BASE_URL` are available | MEDIUM | Gate via env (e.g. `E2E_MODE=real`) or a separate Playwright project. Skip/soft-fail cleanly when backend absent so it never blocks the default loop. |
| Test fixtures/factories for game state | `gameState` and play results are large, nested, replaced wholesale — factories keep tests readable and reduce duplication | MEDIUM | `makeGameState(overrides)`, `makePlayResult(overrides)`, roster builders for `TeamData`. Shared by store, component, and E2E-mock layers — single source of canned shapes. |
| Watch mode as the primary dev inner loop | Sub-second re-runs on save turn tests into a design tool, not a chore | LOW | `vitest` (no `run`). Ships free with the runner; call it out so it's actually used. |
| Coverage report surfaced/inspectable (HTML or summary) | Turns report-only coverage into an actionable map of untested priority code | LOW | `reporters: ['text', 'html']`; scope `include` to `src/` so vendor/config noise doesn't dilute the signal. |
| Component tests driven by store state (mount with pre-seeded Pinia) | Verifies presentation reacts correctly to `gameState` / async flags (loaders, snackbar, result rendering) — the layer most likely to silently break | MEDIUM | Seed the store, mount, assert rendered outcome color/label/icon. Pairs with factories. |
| Playwright trace-on-failure | Fast root-cause for E2E failures without re-running blind | LOW | `trace: 'on-first-retry'` (or `retain-on-failure`). Nearly free config, big debugging payoff. |

### Anti-Features (Commonly Requested, Often Problematic)

Testing habits that look responsible but add cost without proportional value — deliberately NOT doing these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real backend in *every* E2E run | "Only a real backend is a true test" | Slow, flaky, non-hermetic, backend-coupled, breaks offline/local loop; non-deterministic server data makes assertions brittle | Mocked-API as default; real-backend as an opt-in, env-gated mode for periodic true-signal runs. |
| Snapshot-testing every component | "Snapshots catch any change" | Huge brittle snapshots (Vuetify markup churns), reviewers rubber-stamp `-u`, tests assert framework internals not behavior | Assert specific behavior/output (color/label/icon, presence of loader). Reserve snapshots for small, stable, intentional serializations. |
| Chasing 100% / enforced coverage threshold now | "100% means fully tested" | Rewards testing trivial/generated code, punishes hard-to-test glue, blocks work before a baseline exists (explicitly out of scope in PROJECT.md) | Report-only coverage; aim for meaningful coverage of the ranked priority targets. Add thresholds later, if ever, once baseline exists. |
| Testing framework/library internals | "Test everything for safety" | Testing that Vuetify renders a `<v-btn>` or that Pinia stores a ref re-tests third-party code — pure maintenance cost, no app signal | Test *your* logic and *your* wiring: domain rules, store error branches, how components react to state. |
| Testing the known tech-debt scaffold (`getHardCodedValue()`, unused `counter.js`) | "Coverage says it's untested" | Locks in dead/placeholder code the team intends to delete; couples tests to throwaway surface | Exclude scaffold from `coverage.include`; don't write tests for code slated for removal. |
| Over-mocking pure domain functions | "Mock dependencies for isolation" | `src/game/` has no dependencies — mocking it hides real logic and inverts the value of the cheapest, highest-signal tests | Call pure functions directly with real inputs (TESTING.md "Do NOT mock" guidance). |
| Refactoring app source to make it "testable" (e.g. extracting `src/api/`) | "Inline axios is hard to mock" | Explicitly out of scope this milestone; conflates test-adding with app refactor, expands blast radius | Test current code as-is via `vi.mock('axios')`; log the api-client extraction as tech debt for a later milestone. |
| Asserting on live/non-deterministic server responses in real-backend E2E | "Verify the actual result" | Backend simulates outcomes → results vary run-to-run → false failures | In real-backend mode assert on invariants (request round-trips, state transitions occur, no errors), not on specific outcome values. |

## Feature Dependencies

```
Vitest runner (alias + jsdom + globals)
    ├──requires──> npm test scripts (entry points to the runner)
    ├──enables──> Domain unit tests (src/game/)        [no further deps]
    ├──enables──> Coverage reporting (@vitest/coverage-v8)
    │                  └──enhanced-by──> Coverage report surfaced (HTML/summary)
    └──enables──> Fresh Pinia per test
                       ├──requires-for-stores──> axios mocking
                       │                              └──enables──> Error-branch coverage
                       └──requires-for-components──> Vuetify plugin registration
                                                          └──enables──> Store-driven component tests

Test fixtures/factories ──enhances──> store tests, component tests, E2E route mocks (shared canned shapes)

Playwright config
    └──enables──> Hermetic E2E (route mocking, DEFAULT)
                       ├──enhanced-by──> Playwright trace-on-failure
                       └──variant──> Real-backend E2E toggle (env-gated)

Deterministic tests ──constrains──> ALL layers (fake timers, no live network in unit/component,
                                     invariant-only assertions in real-backend E2E)

Real-backend-every-run  ──conflicts──> Hermetic-default E2E + Deterministic tests
Enforced 100% coverage  ──conflicts──> Report-only scope (PROJECT.md)
```

### Dependency Notes

- **Runner before everything:** No capability functions without the Vitest config (alias + jsdom + globals). This is the first phase, no exceptions.
- **Scripts are the runner's UI:** `test`/`test:watch`/`test:coverage` are trivial but gate day-to-day usability; land them with the runner.
- **Coverage requires the runner + provider:** `@vitest/coverage-v8` plugs into an existing Vitest run; report surfacing (HTML) is an enhancement on top.
- **Fresh Pinia gates all stateful tests:** Both store and component tests break without per-test Pinia isolation — it's a prerequisite, not an add-on.
- **axios mocking gates store tests; Vuetify plugin gates component tests:** These are the two distinct "mount/exercise" prerequisites; error-branch and store-driven-component tests build on them respectively.
- **Factories enhance three layers at once:** Because `gameState` is replaced wholesale from server shapes, one set of factories feeds store mocks, component seeding, and E2E route stubs — build once, reuse everywhere.
- **Hermetic E2E is the default; real-backend is a gated variant:** They share the same specs but differ in transport. Real-backend must degrade gracefully (skip when no backend) so it never blocks the default loop.
- **Determinism is a cross-cutting constraint:** It shapes assertions in every layer and is what the "real-backend-every-run" and "100% coverage" anti-features directly violate.

## MVP Definition

### Launch With (v1)

Minimum viable trustworthy suite.

- [ ] Vitest runner (alias + jsdom + globals) — nothing runs without it
- [ ] `test` / `test:watch` / `test:coverage` npm scripts — usable entry points
- [ ] Domain unit tests for `src/game/playOutcome.js` (+ SPFMetadata/TeamData) — highest signal, zero mocking, the confidence floor
- [ ] Fresh Pinia per test — prerequisite for all stateful tests
- [ ] `gameStore` tests with mocked axios incl. error branches + `finally`-flag resets — covers the app's real error UX
- [ ] Coverage reporting (report-only) — needed to steer "meaningful coverage of priority targets"

### Add After Validation (v1.x)

Once the unit/store base is green and trusted.

- [ ] Component tests with `createVuetify()` + seeded Pinia (e.g. `PlayResult.vue`) — trigger: store layer stable
- [ ] Test fixtures/factories for `gameState` / play results / rosters — trigger: duplication of canned shapes appears across store/component tests
- [ ] Playwright hermetic E2E for the play flow (route-mocked, default) — trigger: component layer trusted, ready for full-flow wiring coverage
- [ ] Playwright trace-on-failure + coverage HTML report — trigger: first non-trivial debugging or coverage-gap session

### Future Consideration (v2+)

Deferred per PROJECT.md scope.

- [ ] Real-backend E2E toggle (env-gated) — defer: depends on stable backend + `VITE_API_BASE_URL`; add once hermetic E2E is solid
- [ ] CI integration (GitHub Actions) — defer: explicitly out of scope; add once suite is stable locally
- [ ] Enforced coverage thresholds — defer: only after a meaningful baseline exists; may never be desirable
- [ ] `src/api/` client extraction to simplify mocking — defer: app refactor, out of scope this milestone (logged tech debt)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Vitest runner (alias + jsdom + globals) | HIGH | LOW | P1 |
| npm test/watch/coverage scripts | HIGH | LOW | P1 |
| Domain unit tests (`src/game/`) | HIGH | LOW | P1 |
| Fresh Pinia per test | HIGH | LOW | P1 |
| axios mocking + store error branches | HIGH | MEDIUM | P1 |
| Coverage reporting (report-only) | MEDIUM | LOW | P1 |
| Vuetify plugin registration for components | MEDIUM | MEDIUM | P2 |
| Store-driven component tests | MEDIUM | MEDIUM | P2 |
| Test fixtures/factories | MEDIUM | MEDIUM | P2 |
| Hermetic (route-mocked) Playwright E2E | HIGH | HIGH | P2 |
| Watch mode (surfaced as inner loop) | MEDIUM | LOW | P2 |
| Coverage HTML report + Playwright trace | LOW | LOW | P2 |
| Real-backend E2E toggle | MEDIUM | MEDIUM | P3 |
| CI integration | HIGH | MEDIUM | P3 (out of scope) |
| Enforced coverage thresholds | LOW | LOW | P3 (out of scope) |

**Priority key:**
- P1: Must have for a trustworthy v1 suite
- P2: Add once the P1 base is green
- P3: Defer (out of this milestone's scope)

## Competitor Feature Analysis

Reference stacks for a Vue 3 + Vite test suite, and where we land.

| Capability | Vue "official" scaffold (create-vue) | Testing Library approach | Our Approach |
|------------|--------------------------------------|--------------------------|--------------|
| Unit/component runner | Vitest + `@vue/test-utils` + jsdom | Vitest + `@testing-library/vue` | Vitest + `@vue/test-utils` + jsdom (matches existing toolchain; TESTING.md) |
| Store isolation | Fresh Pinia per test | Fresh Pinia per test | Fresh Pinia per test (`beforeEach`) |
| Network in unit tests | Mock module / MSW | MSW handlers | `vi.mock('axios')` (no refactor; inline transport as-is) |
| E2E | Playwright / Cypress, real or mocked | Playwright | Playwright, **mocked-API default** + real-backend opt-in |
| Coverage | `@vitest/coverage-v8`, thresholds optional | v8, optional | v8, **report-only** (no threshold this milestone) |
| CI | GitHub Actions template included | Actions | **Deferred** (local-only) |

## Sources

- `.planning/PROJECT.md` — milestone scope, constraints, key decisions (HIGH — project canonical)
- `.planning/codebase/TESTING.md` — current no-test state, recommended framework, priority targets, patterns, mocking guidance (HIGH — direct codebase analysis)
- `.planning/codebase/ARCHITECTURE.md` — layered architecture, backend-authoritative play path, error-handling strategy, tech-debt anti-patterns (HIGH — direct codebase analysis)
- `package.json` — confirmed Vite 4 / Vue 3.3 / Pinia 2 / Vuetify 3.6; existing scripts (HIGH — direct read)
- Established Vue 3 + Vite testing conventions (create-vue scaffold, Vitest + @vue/test-utils, Playwright route mocking) (HIGH — widely idiomatic). Vitest↔Vite version pairing (Vitest 1.x for Vite 4) is MEDIUM confidence on the exact ceiling; verify at install.

---
*Feature research for: Vue 3 SPA automated test suite*
*Researched: 2026-07-13*
