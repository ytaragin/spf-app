---
phase: 05-end-to-end-tests
plan: 01
subsystem: e2e-testing
tags: [playwright, e2e, testing]
requires: []
provides: [playwright-config, e2e-play-flow-spec, e2e-fixtures]
affects: [package.json]
tech-stack:
  added: ["@playwright/test ^1.61.1"]
  patterns: ["page.route() hermetic mocking", "webServer auto-boot", "projects: mocked/live"]
key-files:
  created:
    - playwright.config.js
    - e2e/fixtures/playFlowMocks.js
    - e2e/play-flow.spec.js
  modified:
    - package.json
    - package-lock.json
    - .gitignore
decisions:
  - "Reused D-01..D-08 from 05-CONTEXT.md verbatim (mocked/live projects, single spec file with internal branching, e2e/fixtures/ separate from test/factories/)"
  - "Play-call selectors (OffensePlaySelector) are not driven by the test since Run Play is gated only on lineupSubmitted, not on a submitted play call — kept the spec minimal per the actual gating logic in GameLayout.vue"
metrics:
  duration: "~45m"
  completed: 2026-07-17
status: complete
---

# Phase 5 Plan 1: Playwright E2E Play-Flow Test Summary

Installed Playwright and delivered a hermetic (route-mocked) two-play end-to-end test of the core play flow, plus an opt-in `--project=live` mode against a real backend.

## What Was Built

**Task 1 — Playwright install + config**
- Added `@playwright/test ^1.61.1` as a devDependency (verified as the official first-party Microsoft package on npm before installing, per the threat model's package-legitimacy note).
- Created `playwright.config.js`: `testDir: './e2e'`, `fullyParallel: false`, `webServer` running `npm run dev` against `http://localhost:5173` (Vite's default dev port; `reuseExistingServer` when not in CI), and a `projects` array of exactly `mocked` (default) and `live`, both sharing the same `baseURL` — the distinguishing behavior between them lives entirely in the spec file (D-07), not in the config.

**Task 2 — Mock fixtures**
- Created `e2e/fixtures/playFlowMocks.js` exporting: `awayPlayersResponse`, `homePlayersResponse` (full `{ team, players }` shapes matching `TeamData`'s constructor expectations, with `position` set on every player record so `getPlayersForPositions` works), `nextTypeResponse`, `lineupAckResponse`, `playCallAckResponse`, `runPlayAckResponse` (plain string acks matching what the store assigns directly to `gameMsg.value`), `buildGameStateResponse(overrides)` (all nine `gameState` fields), and `buildPlayResultResponse(playCounter, overrides)` (array-wrapped `new_state` with a full-shape body plus a strictly-increasing `play_counter`, satisfying `fetchPlayResult`'s counter-increase guard).
- Every export carries a JSDoc block comment per CONVENTIONS.md's `playOutcome.js` gold standard. No semicolons, single quotes, 2-space indent — verified via `grep -c ";"` returning `0`.

**Task 3 — Play-flow spec**
- Created `e2e/play-flow.spec.js` with a local `installMocks(page)` helper registering `page.route()` handlers for every endpoint in the play-flow round trip (`/players/away`, `/players/home`, `/game/state`, `/game/nexttype` GET+POST, `/offense|defense/lineup`, `/offense|defense/call`, `/game/play`, `/game/plays*`).
- The `/game/plays*` route handler alternates between play-1 and play-2 fixtures (via a closure counter) using different `down`/`yard_line` values on each invocation, so the test can assert visible state change across the two chained plays (D-03).
- `test.beforeEach` installs mocks only `if (testInfo.project.name !== 'live')` — the `live` project runs with zero mocks installed, letting requests hit the real backend at whatever `VITE_API_BASE_URL` the dev server was started with.
- The single test drives: landing page → "Play" button enabled/click → `/game` navigation → wait for `/game/nexttype` response → submit lineup (play 1) → assert "Lineup set" chip → click "Run Play" → `page.waitForResponse()` on `/game/plays` → assert play-1-specific state text (`Second`) is visible → repeat submit-lineup + run-play for play 2 → assert play-2-specific state text (`Third`) is visible.
- All synchronization uses `expect(locator).toBeVisible()/toBeEnabled()` or `page.waitForResponse()` — zero `page.waitForTimeout()` calls anywhere (verified via `grep -c`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `no-undef` ESLint error on `process` in playwright.config.js**
- **Found during:** Task 3 lint pass across all new files.
- **Issue:** `process.env.CI` triggered `no-undef` since the repo's ESLint config has no Node environment declared for root-level config files.
- **Fix:** Added `/* eslint-env node */` at the top of `playwright.config.js`.
- **Files modified:** `playwright.config.js`
- **Commit:** included in the Task 3 commit (f7675a6)

**2. [Rule 3 - Blocking] Play-call selector interaction omitted**
- **Found during:** Task 3, reading `GameLayout.vue`/`OffensePlaySelector.vue`.
- **Issue:** The plan's context implies interacting with the offensive/defensive play-call selector (`Submit Play` in `OffensePlaySelector.vue`, which posts to `/offense/call`), but `GameLayout.vue`'s "Run Play" button is gated only on `lineupSubmitted`, not on a submitted play call. Driving the `v-select` play-type/target-box dropdowns in the test would add brittle, unnecessary DOM interaction with no effect on gating.
- **Fix:** The spec mocks `/offense/call` and `/defense/call` for full route coverage (per D-02) but does not require the test to click "Submit Play" — the flow reaches "Run Play" purely via lineup submission, matching the app's actual gating logic.
- **Files modified:** `e2e/play-flow.spec.js`
- **Commit:** f7675a6

Also added `.gitignore` entries for `/test-results/`, `/playwright-report/`, `/playwright/.cache/` (Rule 2 — generated Playwright output would otherwise show up as untracked noise after any local test run).

## Verification Results

1. `npm install -D @playwright/test` — succeeded; `@playwright/test ^1.61.1` appears in `package.json` devDependencies.
2. `node -e "require('./playwright.config.js'); console.log('config-ok')"` → `config-ok` (exit 0).
3. `node --input-type=module -e "import('./e2e/fixtures/playFlowMocks.js').then(...)"` → `fixtures-ok`; `buildPlayResultResponse(2)[0].new_state.play_counter === 2` confirmed.
4. `grep -c 'waitForTimeout' e2e/play-flow.spec.js` → `0`.
5. `npx playwright test --project=mocked --list` → enumerated exactly one test (`play-flow.spec.js:53:5 › completes two chained plays end to end`) with no config/parse error.
6. `npx eslint e2e/play-flow.spec.js e2e/fixtures/playFlowMocks.js playwright.config.js` → 0 errors after the `eslint-env node` fix.
7. `npx playwright test --project=mocked` (full execution) was attempted but fails locally because the Chromium browser binary is not installed (`Executable doesn't exist at .../chrome-headless-shell`). This is expected — see Follow-up below.

## Follow-up / Manual Steps Required

- **One-time browser install:** Run `npx playwright install chromium` locally or in CI before the mocked suite can actually execute (not run as part of this plan's automated verification, per instructions — network/CI-dependent download). After that, `npx playwright test --project=mocked` (or `npm run test:e2e -- --project=mocked`) should pass hermetically with zero real network calls.
- **Live project:** `npx playwright test --project=live` requires a real backend running and reachable at the `VITE_API_BASE_URL` configured in `.env`/`.env.development` (`http://127.0.0.1:8080` by default). This was **not** run as part of this execution — it depends on external backend availability and is explicitly out of scope for automated CI verification per the plan's `<verification>` step 6.

## Self-Check: PASSED

- `playwright.config.js` — FOUND
- `e2e/fixtures/playFlowMocks.js` — FOUND
- `e2e/play-flow.spec.js` — FOUND
- Commit `b8a1f60` — FOUND
- Commit `0537624` — FOUND
- Commit `f7675a6` — FOUND
