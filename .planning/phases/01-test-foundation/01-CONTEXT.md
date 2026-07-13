# Phase 1: Test Foundation - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire an idiomatic Vitest test runner into an upgraded Vite 6 toolchain and prove it with one trivial passing test. Deliverables: Vite 4→6 upgrade (+ matching Vue plugins) with no source refactor; Vitest config with `@`→`src` alias, DOM environment, and globals; shared `test/setup.js` (createVuetify + jsdom shims); report-only V8 coverage over `src/**`; and `npm` scripts for run-once, watch, coverage, and E2E entry.

This phase builds test *infrastructure* only. Writing the actual domain/store/component/E2E suites belongs to Phases 2–5. The single Phase-1 test exists solely to prove the runner works.

</domain>

<decisions>
## Implementation Decisions

### Vitest Config Location
- **D-01:** Merge the Vitest `test` block directly into the existing `vite.config.js` using the `/// <reference types="vitest/config" />` triple-slash directive. Single source of truth — the `@`→`src` alias is shared automatically with no duplication. Do NOT create a separate `vitest.config.js` or re-declare the alias.

### DOM Environment
- **D-02:** Use `jsdom` (via `environment: 'jsdom'`, `globals: true`). Chosen for broadest fidelity with Vuetify + `@vue/test-utils`, which the component-test phase (Phase 4) inherits. happy-dom's speed was not worth the Vuetify-compat risk. Install `jsdom` as a devDependency.

### Test File Organization
- **D-03:** Co-locate test files next to source (`src/game/playOutcome.test.js`, `src/stores/gameStore.test.js`, etc.), while shared test infrastructure lives in a top-level `test/` directory (`test/setup.js`, `test/factories/`). This matches Vitest defaults and the codebase TESTING.md recommendation, and preserves locality for the pure-function suites in Phase 2. Vitest `test.include`/`setupFiles` config must account for both locations.

### Vue Plugin Versions (Vite 6 upgrade)
- **D-04:** Lock the Vue plugin bumps to `@vitejs/plugin-vue` `^5` and `@vitejs/plugin-vue-jsx` `^4` (current majors compatible with Vite 6 + Vue 3.3+). Upgrading from current `^4.2.3` / `^3.0.1` respectively. The exact Vite 6 minor is left to research/planner, but the plugin major targets are locked.

### the agent's Discretion
- The exact assertion of the single Phase-1 "trivial proving test" was left open. Recommended (not locked): assert a real `src/game/playOutcome.js` pure function rather than a `1+1` smoke test, so it doubles as the first Phase-2 domain test and proves the `@` alias resolves. Planner may choose the specific function.
- Coverage reporter format (text/html/json) is at planner discretion — requirement only mandates report-only V8 with `all: true` over `src/**`, no enforced threshold.
- Exact Vite 6 minor/patch version.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 1: Test Foundation" — goal, 5 success criteria, hard-gate status
- `.planning/REQUIREMENTS.md` §Foundation — FND-01 through FND-05 (the locked requirements this phase satisfies)

### Codebase Analysis
- `.planning/codebase/TESTING.md` — current no-tests state, recommended Vitest setup, suggested scripts/config, highest-value targets, mocking guidance
- `.planning/codebase/STACK.md` — Vite/Vue/Vuetify/Pinia versions, Node 20 devcontainer, `@`→`src` alias origin

### Existing Config (must be modified, not replaced)
- `vite.config.js` — current Vite 4 config; the `@`→`src` alias and Vue/JSX plugins live here. Vitest config merges into this file (D-01).
- `package.json` — current deps/scripts; target for Vite 6 bump, plugin bumps (D-04), test-tooling installs, and new npm scripts (FND-05).

No additional external specs or ADRs — decisions above are complete.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.js` `@`→`src` alias — reused directly by Vitest (D-01), satisfying FND-02's alias-reuse constraint with zero duplication.
- `src/game/playOutcome.js` — pure, dependency-free functions; ideal target for the single proving test (no mocks, no DOM needed).
- `src/main.js` — reference for `createVuetify()` setup (md1 blueprint, custom themes, mdi icons); `test/setup.js` mirrors the minimal Vuetify registration needed for mounting (FND-03).

### Established Patterns
- No test infrastructure exists yet — this phase establishes it from scratch (greenfield for test tooling).
- Prettier/ESLint conventions apply to new test files: no semicolons, single quotes, 2-space indent, print width 100, no trailing commas.
- Composition API + `<script setup>` throughout; Vuetify needs a `createVuetify()` plugin instance when components mount (relevant to `test/setup.js`, exercised in Phase 4).

### Integration Points
- `vite.config.js` — Vitest `test` block added here (D-01).
- `test/setup.js` — new shared setup registering Vuetify + jsdom shims (ResizeObserver, matchMedia, CSS.supports), wired via Vitest `setupFiles`.
- `package.json` `scripts` — new `test`, `test:watch`, `test:coverage`, and E2E entry script (FND-05).
- Devcontainer Node 20 — satisfies Vite 6's `^18||^20||>=22` engine requirement (flagged in STATE.md; confirm during planning).

</code_context>

<specifics>
## Specific Ideas

- Config style is idiomatic-Vitest: triple-slash `vitest/config` reference in `vite.config.js` rather than a standalone config file.
- Coverage is deliberately report-only this milestone — no thresholds, `all: true` over `src/**` (excludes documented dead code like `getHardCodedValue()` / `counter.js` per REQUIREMENTS.md out-of-scope).

</specifics>

<deferred>
## Deferred Ideas

- **CI integration (CI-01/02/03)** — GitHub Actions for unit/component/E2E and coverage publishing. v2 requirement; not this milestone.
- **Coverage threshold enforcement (COV-01)** — failing the build below a target %. Deferred to v2; this phase is report-only.
- **happy-dom migration** — could revisit for speed once the suite matures and Vuetify-compat is proven under jsdom. Not now.

None of these are in Phase 1 scope — discussion stayed within the phase boundary.

</deferred>

---

*Phase: 1-Test Foundation*
*Context gathered: 2026-07-13*
