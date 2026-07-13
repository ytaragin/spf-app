# Project Research Summary

**Project:** SPF App — Automated Testing
**Domain:** Automated test suite (unit / store / component / E2E) for a Vue 3 + Vite + Pinia + Vuetify backend-authoritative SPA
**Researched:** 2026-07-13
**Confidence:** HIGH

## Executive Summary

This milestone adds an automated testing layer to a Vue 3 + Vite + Pinia + Vuetify SPA that currently has **zero tests**. The idiomatic, expert-consensus stack is uncontroversial: **Vitest + @vue/test-utils + a DOM env (happy-dom/jsdom) + @vitest/coverage-v8** for in-process unit/store/component tests, and **@playwright/test** for out-of-process E2E — a **two-runner architecture** where Vitest and Playwright share only the app itself, never a config. The work maps cleanly onto a **strict dependency cone**: runner+config foundation → domain unit → store unit → component → E2E, with each higher layer depending on the infrastructure below being proven.

**The single most important finding — a hard blocker that surfaced across both Stack and Features research — is that the project's current `vite@^4` is too old for any currently-maintained Vitest.** Every live Vitest major (4.x/3.x/2.x/1.x) requires Vite 5+; only the EOL Vitest 0.34 supports Vite 4. The prescribed resolution is an explicit **Phase 1 prerequisite: upgrade Vite 4 → 6 (plus `@vitejs/plugin-vue@6` and `@vitejs/plugin-vue-jsx@5`) BEFORE installing any test tooling**, followed by a `npm run build` / `npm run dev` smoke check. This is a ~30-minute, low-risk bump (Vite 6 keeps Node `^18||^20||>=22`, matching the Node 20 devcontainer) and unblocks the entire modern toolchain. The alternative — pinning to EOL Vitest 0.34 to preserve Vite 4 — trades a trivial upgrade for a permanently dead dependency and is explicitly rejected.

Key risks beyond the version blocker are all well-documented and preventable: **Vuetify components crash under a bare DOM env** (need `createVuetify()` + `ResizeObserver`/`matchMedia`/`CSS.supports` shims), **Pinia state leaks between tests** (need fresh Pinia per test), **`vi.mock('axios')` hoisting/shape mistakes**, **async promise-flush races**, and **Playwright flakiness racing the authoritative backend** (need web-first assertions + `waitForResponse`, never hard waits). All are addressed by establishing conventions in the right phase up front. Scope is deliberately disciplined: report-only coverage (no thresholds), no CI, no app-source refactoring, mocked-API E2E as the default with real-backend as an opt-in gated mode.

## Key Findings

### Recommended Stack

The stack is the create-vue idiomatic default for Vue 3 + Vite, verified live against the npm registry (HIGH confidence). The only real decision is the **Vite 4 → 6 prerequisite upgrade** — without it, no maintained Vitest installs. After the bump, the in-process runner reuses Vite's transform pipeline and the `@`→`src` alias by construction, so `<script setup>` SFCs and `@/...` imports "just work."

**Core technologies:**
- **Vite 6** (`^6.4.3`, upgraded from 4) + `@vitejs/plugin-vue@6` + `@vitejs/plugin-vue-jsx@5` — **prerequisite bump**; unblocks Vitest 4, keeps Node 20 support, no source refactor.
- **Vitest** (`^4.1.10`) — test runner for domain/store/component; reuses Vite config, alias, plugins.
- **@vue/test-utils** (`^2.4.11`) — official Vue 3 component mounting; `global.plugins` is the seam for Vuetify + Pinia.
- **happy-dom** (`^20.10.6`) — default DOM env (faster than jsdom, no Node ≥20.19 floor); **jsdom `^26`** as per-file fallback for Vuetify measurement quirks.
- **@vitest/coverage-v8** (`^4.1.10`, lockstep-pinned to Vitest) — report-only V8 coverage, no instrumentation.
- **@playwright/test** (`^1.61.1`) — E2E; `page.route()` for hermetic mocking, `webServer` to boot the app. Node ≥18, independent of the Vite/Vitest chain.
- **@pinia/testing** (`^1.0.2`) — `createTestingPinia()` for component tests (not needed for pure store unit tests).

> **Version guardrails:** keep all `@vitest/*` packages on the exact same version (`4.1.10`); avoid jsdom `^29` (needs Node ≥20.19); do NOT use Jest, Cypress, or Vitest 0.34.

### Expected Features

The "features" here are the *capabilities of a trustworthy test suite*. A capability is table stakes if its absence makes the suite untrustworthy/unusable.

**Must have (table stakes):**
- Vitest runner wired into Vite config (alias reuse, DOM env, `globals: true`) — nothing runs without it
- `test` / `test:watch` / `test:coverage` npm scripts — day-to-day entry points
- Domain unit tests for `src/game/` pure functions — highest signal, zero mocking, confidence floor
- Fresh Pinia per test (`setActivePinia(createPinia())`) — prerequisite for all stateful tests
- `gameStore` tests with mocked axios **including error branches + `finally`-flag resets** — covers real error UX
- Vuetify plugin registration in component mounts — components fail to resolve without it
- Deterministic tests (no real time/network/random ordering)
- Coverage reporting (report-only, `all: true`, `include: ['src/**']`)
- Playwright E2E for the core play flow, **mocked-API by default**

**Should have (competitive):**
- Hermetic E2E via route mocking as the default mode — fast, offline, reproducible
- Test fixtures/factories for game state (`makeGameState`/`makePlayResult`/`makeRoster`) — shared across store/component/E2E layers
- Watch mode surfaced as the primary inner loop; coverage HTML report; Playwright trace-on-failure
- Store-driven component tests (mount with pre-seeded Pinia)

**Defer (v2+ / out of scope):**
- Real-backend E2E toggle (env-gated) — depends on stable backend + `VITE_API_BASE_URL`
- CI integration (GitHub Actions) — explicitly out of scope this milestone
- Enforced coverage thresholds — only after a baseline exists
- `src/api/` client extraction — app refactor, logged tech debt

**Explicit anti-features (deliberately NOT doing):** real backend in *every* E2E run, snapshot-testing every component, chasing 100%/enforced coverage, testing framework internals, testing known tech-debt scaffold, over-mocking pure domain fns, refactoring app source to be "testable," asserting on non-deterministic server responses.

### Architecture Approach

A **two-runner architecture**: Vitest owns all in-process tests (sharing Vite's transform + `@`→`src` alias via `mergeConfig` or a `test:` block); Playwright owns out-of-process browser E2E in a separate `playwright.config.js`. Within Vitest, layers form a **strict dependency cone** of increasing setup cost. Tests are **co-located** (`*.test.js` next to source); shared infra (`test/setup.js`, `test/factories/`) lives in a dedicated `test/` root; E2E lives in `e2e/` and is excluded from Vitest discovery.

**Major components:**
1. **Vitest config** (`vitest.config.js` via `mergeConfig`) — discovery, DOM env, alias reuse, globals, setupFiles, coverage
2. **Global setup file** (`test/setup.js`) — Vuetify plugin, per-test Pinia reset, global mocks (`ResizeObserver`, `matchMedia`, `CSS.supports`)
3. **Factories** (`test/factories/*`) — deterministic builders; single source of game-state shape across store/component/E2E
4. **Three Vitest suites** — domain (no setup), store (mocked axios + fresh Pinia), component (@vue/test-utils + Vuetify)
5. **Playwright config + E2E suite** — `webServer`, env-toggled `page.route` mock (default) vs real backend

### Critical Pitfalls

1. **Vite 4 blocks all maintained Vitest** — upgrade Vite 4→6 as a Phase 1 prerequisite before installing test deps; smoke-check build/dev.
2. **Vuetify crashes under bare DOM env** — provide `createVuetify()` via `global.plugins` AND shim `ResizeObserver`/`matchMedia`/`CSS.supports` in `setupFiles`; prove setup.js works before writing component tests.
3. **Pinia state leaks between tests** — `setActivePinia(createPinia())` in `beforeEach`; verify suite passes run-together and in random order.
4. **`vi.mock('axios')` hoisting/shape mistakes** — top-of-file `vi.mock`, then `vi.mocked(axios, true)`; use `mockRejectedValueOnce({ response: { data } })` to match the app's error extraction.
5. **Playwright racing the authoritative backend** — web-first auto-retrying assertions + `page.waitForResponse(/\/game\/play/)`; **never** `waitForTimeout`; assert user-visible outcomes, not store internals.

*(Also: async promise-flush races → `await flushPromises()`; coverage counting wrong files → `all: true` + `include/exclude`; `import.meta.env`/`@` alias not inherited → `mergeConfig` + `vi.stubEnv`; hermetic/real E2E toggling done ad-hoc → centralize interception behind one `E2E_MODE` switch.)*

## Implications for Roadmap

Based on research, suggested phase structure (the dependency cone maps directly onto phases, each a shippable increment):

### Phase 1: Test Foundation (incl. Vite upgrade prerequisite)
**Rationale:** Hard gate — nothing runs before the runner+config exists, and the runner cannot be installed until Vite is bumped. Combine the prerequisite upgrade and foundation into the first phase.
**Delivers:** Vite 4→6 upgrade (+ Vue plugins) with build/dev smoke check; installed test deps; `vitest.config.js` (alias reuse via `mergeConfig`, DOM env, `globals`, coverage `all:true`); `test`/`test:watch`/`test:coverage` scripts; `test/setup.js` with Vuetify + global shims; proven with one trivial domain test.
**Addresses:** Vitest runner, npm scripts, coverage reporting (all table stakes).
**Avoids:** Pitfall 1 (Vite blocker), Pitfall 2 (jsdom API gaps), Pitfall 9 (coverage config), Pitfall 10 (`@` alias / `import.meta.env`).

### Phase 2: Domain Unit Tests (`src/game/`)
**Rationale:** Earliest value per unit of effort — pure, dependency-free, high logic density, zero mocking. A green suite here proves the foundation AND locks down the highest-risk pure logic. **Start here.**
**Delivers:** Tests for `playOutcome.js` (`isTurnover`, `netYards`, `outcomeColor`, `outcomeSummary`, `classifyOutcome`, `managedTeamHadPossession`) + `SPFMetadata`/`TeamData` methods.
**Uses:** Vitest (no mocks, no setup). **Depends on:** Phase 1.

### Phase 3: Store Unit Tests
**Rationale:** Introduces the axios-mock + Pinia-reset + factories patterns; covers the app's real error UX (snackbar via `gameStore.error`).
**Delivers:** `gameStore`/`teamStore` tests with `vi.mock('axios')`, fresh Pinia, success + error branches, `finally` flag resets; first factories (`makeGameState`/`makePlayResult`).
**Avoids:** Pitfall 3 (Pinia leakage), Pitfall 4 (axios mock shape), Pitfall 5 (async flush).

### Phase 4: Component Tests
**Rationale:** First layer that *requires* `test/setup.js` (Vuetify + globals). Must not precede a proven setup file.
**Delivers:** Store-driven SFC tests (e.g. `PlayResult.vue`) mounted with `createVuetify()` + seeded/testing Pinia; asserts rendered outcome color/label/icon and async flags.
**Implements:** Component suite + `mountWithVuetify` helper. **Avoids:** Pitfall 2 (Vuetify/DOM), Pitfall 5.

### Phase 5: E2E (Playwright)
**Rationale:** Separate runner, slowest/flakiest, some overlap with 2–4 — natural finale. **Mock mode first**, then real-backend toggle.
**Delivers:** `playwright.config.js` (`webServer` + `E2E_MODE` switch); hermetic play-flow spec with centralized `page.route` interception returning full-shape `new_state`; trace-on-failure; env-gated real-backend smoke spec.
**Avoids:** Pitfall 6 (backend races), Pitfall 7 (`webServer`/env), Pitfall 8 (ad-hoc toggling).

### Phase Ordering Rationale

- **Strict dependency cone** from architecture research: foundation → domain → store → component → E2E. Phase 1 is the hard gate; the Vite upgrade must precede everything.
- Phases 2–4 could partially parallelize once Phase 1 lands, but **component (4) must not precede its setup file**; E2E (5) is independent (separate runner) but sequenced last as the slowest layer.
- Ordering front-loads the highest signal-per-effort (pure domain) and defers the flakiest, highest-setup work, matching both the value curve and the pitfall-prevention sequence.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (E2E):** The `page.route` mocking must return full-shape `new_state` matching the app's actual request paths (`/game/*`, `/offense/*`, `/defense/*`, `/players/*`) and the counter-gated `fetchPlayResult` polling behavior; verify request globs and payload shapes against real backend responses during planning.

Phases with standard patterns (skip research-phase):
- **Phase 1–4:** Well-documented, idiomatic create-vue patterns; stack versions and configs already verified live in STACK.md. Standard Vitest/@vue/test-utils/Pinia conventions apply directly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions and peer/dependency constraints verified live against the npm registry (2026-07-13); Vite-4-blocker confirmed via `npm ls vite`. |
| Features | HIGH | Derived from PROJECT.md scope + direct codebase maps; capability tiers grounded in idiomatic Vue/Vite conventions. |
| Architecture | HIGH | Official Vitest/Playwright docs (v4) + validated repo analysis; two-runner + dependency-cone is established convention. |
| Pitfalls | HIGH | Core pitfalls documented in official Vitest/Vuetify/Pinia/Playwright docs and widely-reproduced issues; version-specific notes MEDIUM. |

**Overall confidence:** HIGH

### Gaps to Address

- **Devcontainer Node exact version:** Vite 6 is the safe target for a plain `:20` image; if Node is pinned ≥20.19, Vite 7 + jsdom 29 become viable but offer no functional benefit. Confirm Node version during Phase 1 planning.
- **happy-dom vs jsdom for Vuetify:** happy-dom is the default; some Vuetify measurement/overlay components may need a per-file `// @vitest-environment jsdom` override. Decide per-component during Phase 4, keep jsdom `^26` available.
- **E2E mock payload fidelity:** Full-shape `new_state` (e.g. `first_down_target`) must be captured/validated against a real backend so hermetic runs don't produce `undefined`-render false failures. Resolve when authoring Phase 5 fixtures.
- **axios mocking migration risk:** Current bare-global `axios` mocking breaks if the app later adopts `axios.create()` (noted tech debt); document the dependency in store tests.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view` / `npm ls vite`), 2026-07-13 — live versions + peer/dependency/engines for vitest, @vue/test-utils, @vitest/coverage-v8, happy-dom, jsdom, @playwright/test, vite, @vitejs plugins; confirmed project resolves to `vite@4.5.14`.
- Vitest official docs — `vi.mock` hoisting/`vi.mocked`, `vi.stubEnv`, coverage (`all`/`include`/`exclude`), `mergeConfig`, projects/config (v4).
- Vue Test Utils official docs — `global.plugins`, `flushPromises`, `createTestingPinia` (@pinia/testing).
- Vuetify docs + reproduced GitHub issues — `createVuetify` in tests; jsdom `ResizeObserver`/`matchMedia`/`CSS.supports`/`visualViewport` shims.
- Pinia official testing guide — `setActivePinia(createPinia())`, testing pinia, `stubActions`.
- Playwright official docs — web-first assertions, `waitForResponse`, `page.route`, `webServer`, traces/retries.
- Vite env docs — `VITE_`-prefixed vars are build-time public constants.
- Project canonical: `.planning/PROJECT.md` + codebase maps (`.planning/codebase/{TESTING,ARCHITECTURE,STRUCTURE,CONCERNS}.md`, `package.json`) — no-test state, priority targets, backend-authoritative flow, `play_counter` polling bug, whole-object `new_state` replacement, committed `.env*`, Vite 4 toolchain.

### Secondary (MEDIUM confidence)
- Vitest↔Vite version pairing exact ceiling (compatibility *direction* is HIGH; exact bounds re-verify at install).
- Version-specific pitfall notes (Node floors, happy-dom vs jsdom Vuetify quirks).

### Tertiary (LOW confidence)
- None material — findings converge across primary sources.

---
*Research completed: 2026-07-13*
*Ready for roadmap: yes*
