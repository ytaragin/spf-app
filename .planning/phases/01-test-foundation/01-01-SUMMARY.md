---
phase: 01-test-foundation
plan: 01
subsystem: test-infrastructure
tags: [vitest, vite6, jsdom, vuetify, coverage]
requires: []
provides:
  - vitest-runner
  - test-setup-shims
  - vuetify-test-factory
  - npm-test-scripts
affects:
  - package.json
  - vite.config.js
tech-stack:
  added:
    - vitest@^3.2.7
    - "@vitest/coverage-v8@^3.2.7"
    - jsdom@^26.1.0
    - "@vue/test-utils@^2.4.11"
  patterns:
    - "Reuse vite.config.js resolve.alias for Vitest (no duplication)"
    - "Per-mount Vuetify factory (createTestVuetify) not global app.use"
    - "Co-located *.test.js next to source under src/**"
key-files:
  created:
    - test/setup.js
    - src/game/playOutcome.test.js
  modified:
    - package.json
    - package-lock.json
    - vite.config.js
decisions:
  - "Vite 6 + Vitest 3.2.7 chosen as the only self-consistent pair (Vitest 4 needs Vite 7+)"
  - "Inline vuetify in test.server.deps so Vitest transforms its CSS imports"
metrics:
  duration: 3 min
  completed: 2026-07-13
status: complete
---

# Phase 1 Plan 01: Test Foundation Summary

Established the full Vite 6 → Vitest 3.2.7 → jsdom → `@`-alias test toolchain, proven end to end by a green `npm test` running one real domain test against `src/game/playOutcome.js`.

## What Was Built

- **Task 1 (`9d4861d`):** Upgraded `vite` → `^6.4.3`, `@vitejs/plugin-vue` → `^5.2.4`, `@vitejs/plugin-vue-jsx` → `^4.2.0`; added `vitest`, `@vitest/coverage-v8`, `jsdom`, `@vue/test-utils` dev deps; added `test`, `test:watch`, `test:coverage`, `test:e2e` npm scripts. `npm run build` green on Vite 6 with no source refactor.
- **Task 2 (`e78e541`):** Merged a `test` block into `vite.config.js` (jsdom env, globals, setupFiles, co-located include, report-only V8 coverage with no thresholds) reusing the existing `@`→`src` alias; added the proving test `src/game/playOutcome.test.js` importing via the `@` alias.
- **Task 3 (`df6640d`):** Wrote `test/setup.js` with `ResizeObserver`, guarded `window.matchMedia`, and guarded `CSS.supports` jsdom shims plus a `createTestVuetify()` per-mount factory. `npm test` and `npm run test:coverage` both green.

## Verification Results

- `npm run build` — exit 0, `dist/` produced on Vite 6.4.3 (FND-01 build half).
- `npm test` — 2/2 tests pass, `@` alias resolves, jsdom + globals active (FND-02).
- `test/setup.js` — loads without error, registers 3 shims + Vuetify factory (FND-03).
- `npm run test:coverage` — exit 0, report-only V8 text summary over `src/**` (FND-04).
- `npm run` — lists `test`, `test:watch`, `test:coverage`, `test:e2e` (FND-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vuetify CSS import broke Vitest module resolution**
- **Found during:** Task 3 (first `npm test` run)
- **Issue:** `test/setup.js` imports `vuetify/components`, whose component CSS imports (`VApp.css`) threw `TypeError: Unknown file extension ".css"` because Vitest externalized Vuetify to Node's ESM loader.
- **Fix:** Added `test.server.deps.inline: ['vuetify']` to `vite.config.js` so Vitest transforms Vuetify (and its CSS imports) instead of externalizing it. This is the idiomatic Vitest+Vuetify remedy and does not alter app source.
- **Files modified:** vite.config.js
- **Commit:** df6640d

## Manual Verification Deferred

- `npm run dev` browser render check (FND-01 dev-serve half) — manual, per 01-VALIDATION.md.

## Self-Check: PASSED

- test/setup.js — FOUND
- src/game/playOutcome.test.js — FOUND
- vite.config.js test block — FOUND
- Commits 9d4861d, e78e541, df6640d — FOUND
