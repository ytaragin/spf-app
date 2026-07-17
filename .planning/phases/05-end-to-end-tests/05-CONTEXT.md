# Phase 5: End-to-End Tests - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Playwright E2E coverage of the core play flow — starting from the landing page (team load) through `/game`, picking a play type, assigning a lineup, running two chained plays, and seeing results — running hermetically (route-mocked, no backend) by default, with an opt-in project to run against a real backend via `VITE_API_BASE_URL`.

</domain>

<decisions>
## Implementation Decisions

### Route coverage & flow depth (E2E-02)
- **D-01:** Test starts at the landing page (`/`) and mocks `teamStore.fetchPlayers()` (`GET /players` or equivalent) so the "Start Game" button becomes available, then navigates to `/game`.
- **D-02:** From `/game`, mock the full play-flow round trip: `GET /game/state`, `GET /game/nexttype`, `POST /{offense|defense}/lineup`, `POST /offense/call` (or `/defense/call`), `POST /game/play`, `GET /game/plays?result=true&count=1`.
- **D-03:** Chain **two plays** (not just one) to prove state continuity — after the first play resolves, verify the UI reflects updated state (e.g., next play type, play history growing) before running a second play. This goes slightly beyond E2E-02's literal "a play" wording but was an explicit choice to prove statefulness, not just a single round-trip.

### webServer boot strategy
- **D-04:** Playwright's `webServer` config runs `npm run dev` (Vite dev server) — fast startup, no build step required before every E2E run.

### Real-backend toggle (E2E-04)
- **D-05:** Use Playwright's `projects` array with two entries: a default `mocked` project (route mocks installed, runs by default) and a `live` project (no route mocks, hits the real backend). Selected via `--project=live` CLI flag (e.g. `npx playwright test --project=live`).
- **D-06:** The `live` project's `use.baseURL` (or the test's own axios target) resolves from `VITE_API_BASE_URL` — satisfying the roadmap's "env switch (with `VITE_API_BASE_URL`)" wording through the project's env-driven config rather than a raw custom env var like `E2E_MODE`. **Note for planner:** REQUIREMENTS.md's E2E-04 text says "a single `E2E_MODE`/env switch" — this decision reinterprets that as "project selection is the switch, and it reads `VITE_API_BASE_URL`." Flag this to the user if it needs literal alignment during planning.
- **D-07:** A single test file (not two) contains the play-flow test; it branches internally (e.g., checks the active project name / a flag) to decide whether to install route mocks or let requests hit the real backend. Avoids duplicating the flow logic across two files.

### Fixture strategy
- **D-08:** Mock-response fixtures live in a new `e2e/fixtures/` directory, separate from `test/factories/` (Phase 3). Rationale: `test/factories/` builds plain JS objects for seeding Pinia/component state in Vitest; E2E fixtures need full-shape HTTP response bodies (`new_state`, lineup responses, play results) for Playwright's `page.route()` mocking — different shape and purpose, kept independent to avoid coupling test layers.

### the agent's Discretion
- Exact Playwright config file structure (single `playwright.config.js` with a `projects` array vs. more granular structure) is left to the planner/executor.
- How internal branching for mocked-vs-live mode is implemented within the single test file (env check, project-name check, or a shared helper) is left to the agent.
- Directory/file naming inside `e2e/fixtures/` and the specific `e2e/*.spec.js` test file name(s) are left to the agent, following the existing repo's naming conventions where applicable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing conventions & recommended patterns
- `.planning/codebase/TESTING.md` — Testing patterns doc; documents current test file organization conventions (co-location, `<Name>.test.js` naming) that inform (but don't dictate) `e2e/` structure.

### Prior phase context (patterns to carry forward)
- `.planning/phases/04-component-tests/04-CONTEXT.md` — Explicitly deferred `GameLayout.vue` full-flow testing to Phase 5 (this phase) rather than isolated component mounting — confirms this phase is the intended home for the full play-flow assertion.
- `.planning/phases/03-store-unit-tests/03-CONTEXT.md` — Documents the store's error-extraction pattern (`err.response ? err.response.data : err.message`) and existing `test/factories/` shapes — useful reference when shaping `e2e/fixtures/` response bodies to match what `gameStore.js` expects.
- `.planning/phases/01-test-foundation/01-CONTEXT.md` — Test Foundation phase; established `npm run test:e2e` → `playwright test` script already exists in `package.json`, but Playwright itself is not yet installed as a dependency.

### Roadmap & requirements
- `.planning/REQUIREMENTS.md` — E2E-01, E2E-02, E2E-03, E2E-04 (E2E requirements); note the E2E-04 wording reconciliation captured in D-06 above.
- `.planning/ROADMAP.md` Phase 5 section — authoritative success-criteria list (webServer config, hermetic route-mocked flow, `waitForResponse`/web-first assertions, real-backend env toggle).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` already has `"test:e2e": "playwright test"` script (from Phase 1) — Playwright itself is not yet an installed dependency; planner must add it.
- `.env` / `.env.development` define `VITE_API_BASE_URL=http://127.0.0.1:8080` — the real-backend project should point here by default, or allow override.

### Established Patterns
- Backend-authoritative play flow: `src/stores/gameStore.js` calls (in order for the happy path) `GET /game/state`, `GET /game/nexttype`, `POST /{offense|defense}/lineup`, `POST /offense/call` or `/defense/call`, `POST /game/play`, `GET /game/plays?result=true&count=1` — this is the exact endpoint sequence the hermetic test must mock (see D-02).
- `src/views/LandingPage.vue` calls `teamsStore.fetchPlayers()` on mount and shows a loading state while `isLoading` is true, an error state on failure, and the matchup + "Start Game" button on success — the E2E test's first mocked call.
- `src/components/GameLayout.vue` composes `PlayTypeSelector`, `PlayLineup`, a "Run Play" button (disabled until `lineupSubmitted`), `PlayResult`, `FootballField`, and `PlayHistory` — this is the component tree the E2E test drives through real DOM interaction, not isolated mounting (that was Phase 4's job).
- Router: `/` → `LandingPage.vue`, `/game` → lazy-loaded `GameView.vue` (which hosts `GameLayout.vue`).

### Integration Points
- New directory: `e2e/` (test files + `e2e/fixtures/`), new `playwright.config.js` at repo root.
- Reused: `VITE_API_BASE_URL` env var (existing), `npm run dev` (existing script) as the webServer command.

</code_context>

<specifics>
## Specific Ideas

No specific visual/UI references — the goal is proving the existing flow works end-to-end, not changing behavior. The "two chained plays" decision (D-03) was the one deviation from the most literal single-play reading of E2E-02, made deliberately to prove state continuity across plays.

</specifics>

<deferred>
## Deferred Ideas

None raised beyond phase scope — the discussion stayed on implementation mechanics for the already-scoped E2E phase.

### Reviewed Todos (not folded)

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-End-to-End Tests*
*Context gathered: 2026-07-17*
