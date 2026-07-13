# Walking Skeleton — SPF App (Automated Testing)

**Phase:** 1
**Generated:** 2026-07-13

## Capability Proven End-to-End

A developer can run `npm test` and watch one real test assert real `src/game/playOutcome.js`
logic pass green through the full upgraded toolchain: Vite 6 transform → Vitest 3 runner →
jsdom environment + globals → `@`→`src` alias resolution → V8 coverage report.

> This is a **test-infrastructure** skeleton, so the "full stack" is the test-run pipeline
> (build tooling → runner → env → alias → coverage), not an app UI→API→DB path.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build tooling | Vite `^6.4.3` (upgraded from 4) | D-04 lock; Vitest 3 partner; Node 20 devcontainer satisfies engine `^18\|\|^20\|\|>=22`. Do NOT bump to Vite 7/8. |
| Vue plugins | `@vitejs/plugin-vue@^5.2.4`, `@vitejs/plugin-vue-jsx@^4.2.0` | D-04 lock; both declare `vite: '^5.0.0 \|\| ^6.0.0'` peer support. |
| Test runner | Vitest `^3.2.7` | Only self-consistent pair with the Vite-6 lock; Vitest 4 requires Vite 7+ (rejected). `@vitest/coverage-v8` pinned to matching `3.2.7`. |
| Config location | Merged `test` block in `vite.config.js` via `/// <reference types="vitest/config" />` | D-01 single source of truth; `@`→`src` alias reused with zero duplication. NO separate `vitest.config.js`. |
| DOM environment | jsdom `^26.1.0`, `environment: 'jsdom'`, `globals: true` | D-02 broadest Vuetify + `@vue/test-utils` fidelity for Phase 4. happy-dom deferred. |
| Test file layout | Co-located `src/**/*.test.js` + shared infra in top-level `test/` | D-03 matches Vitest defaults and preserves locality. |
| Coverage | `@vitest/coverage-v8`, `all: true` over `src/**`, report-only, no threshold | FND-04 / COV-01 deferred; excludes documented dead code. |
| Vuetify in tests | `createTestVuetify()` factory in `test/setup.js`, applied per-mount | Vuetify is a per-mount plugin; setup holds shims + factory only. |

## Stack Touched in Phase 1

- [x] Project scaffold — Vite 6 upgrade + Vitest/jsdom/coverage install + four npm scripts
- [x] Runner config — merged `test` block reusing the `@`→`src` alias (FND-02)
- [x] Environment — jsdom shims (`ResizeObserver`, `matchMedia`, `CSS.supports`) in `test/setup.js` (FND-03)
- [x] Real assertion — one proving test against real `src/game/playOutcome.js` (FND-02)
- [x] Coverage — report-only V8 summary over `src/**` (FND-04)
- [x] Build integrity — `npm run build` (+ manual `npm run dev`) green on Vite 6 (FND-01)

## Out of Scope (Deferred to Later Slices)

- Actual domain / store / component / E2E test suites (Phases 2–5) — the single Phase-1 test exists only to prove the runner.
- CI integration (CI-01/02/03 — GitHub Actions). v2.
- Coverage threshold enforcement (COV-01). Report-only this milestone.
- Playwright install/config — only the `test:e2e` entry-script placeholder exists now (FND-05); real E2E is Phase 5.
- happy-dom migration — revisit for speed after Vuetify-compat is proven under jsdom.
- Any `src/` refactor — the upgrade is config-only.

## Subsequent Slice Plan

Each later phase adds one vertical test slice on top of this skeleton without changing its
architectural decisions (runner, config location, env, alias, coverage model):

- Phase 2: Domain unit tests — pure `src/game/` logic (playOutcome, SPFMetadata, TeamData), zero mocking.
- Phase 3: Store unit tests — Pinia stores with fresh Pinia + mocked axios + error branches; shared `test/factories/`.
- Phase 4: Component tests — mount key SFCs with the `createTestVuetify()` factory + jsdom shims + seeded Pinia.
- Phase 5: End-to-end tests — Playwright hermetic play-flow (mock default) + env-gated real-backend toggle.
