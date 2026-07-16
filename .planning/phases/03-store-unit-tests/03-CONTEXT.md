# Phase 3: Store Unit Tests - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Unit-test the two Pinia setup stores — `gameStore.js` and `teamStore.js` — with a fresh Pinia instance per test and `axios` mocked (no real network calls). Deliverable: a store test suite covering play-flow actions, error-handling branches (both `err.response` and network/`err.message` paths), and roster/lineup logic, backed by reusable factories in `test/factories/` that Phase 4 (component tests) and Phase 5 (E2E mocks) will also consume. Component and E2E testing belong to Phases 4–5; refactoring `gameStore.js`/`teamStore.js` (e.g. extracting an `src/api/` client, fixing `getHardCodedValue()`) is out of scope for this entire milestone.

</domain>

<decisions>
## Implementation Decisions

### Axios Mocking Strategy
- **D-01:** Use `vi.mock('axios')` at the module level in each store test file (matches `.planning/codebase/TESTING.md`'s documented pattern). Per test, wire behavior with `axios.get.mockResolvedValueOnce(...)` / `axios.post.mockRejectedValueOnce(...)` etc. No shared mock-helper wrapper module, no MSW — keep it simple and matching the already-documented convention.

### Error-Branch Coverage Depth
- **D-02:** **Exhaustive branch coverage**, not representative sampling — this is a deliberate departure from Phase 2's "happy-path first" precedent, because STO-02 explicitly requires failure-path testing. For every action with both an `err.response` branch and an else/network-error branch (`setLineup`, `getLineup`, `setDefensivePlay`, `setOffensivePlay`, `setKickoffPlay`, `setPlayType`, `fetchPlayTypes`, `runPlay`, `fetchPlayers`), test **both** branches explicitly:
  - `err.response` branch: assert `error.value` and `gameMsg.value` are set correctly from `err.response.data`, and the relevant `console.error` call happened.
  - network/`err.message` branch: assert `error.value` falls back appropriately.
  - `runPlay`'s network-error branch additionally **re-throws** — assert the promise rejects.
- **D-03:** In every case, also assert the `finally` block resets the matching `is*ing` loading flag (`isSubmittingLineup`, `isSubmittingPlay`, `isRunningPlay`) regardless of success/failure — this is the actual regression risk (a stuck spinner), not just the error message text.

### Shared Factories Scope (STO-04)
- **D-04:** Create exactly 3 factory files in `test/factories/`:
  - `gameState.js` — `buildGameState(overrides = {})` returning the default `gameState` shape (`home_score`, `away_score`, `quarter`, `time_remaining`, `possession`, `yard_line`, `first_down_target`, `last_status`, `down`), matching the server-shaped `snake_case` fields per CONVENTIONS.md.
  - `lineup.js` — `buildLineup(overrides = {})` returning an offense/defense lineup object shaped like what `setLineup`/`getLineup` send and receive.
  - `players.js` — `buildPlayer(overrides = {})` / `buildRoster(overrides = {})` returning `TeamData`-shaped player records (matching the `{ name, id }` shape seen in `teamStore.js`'s default `team` ref).
  - Each factory takes an `overrides` object so tests customize only what they care about (e.g. `buildGameState({ down: 'Second' })`).
  - These factories are written to be reusable by Phase 4 (component seed data) and Phase 5 (E2E mock payloads) — keep field names matching real backend shape, not simplified test-only shapes.

### Randomized/No-Leakage Verification (Success Criteria 5)
- **D-05:** Satisfy "passes run-together and in randomized order, no Pinia state leakage" structurally: every store test file uses `beforeEach(() => setActivePinia(createPinia()))` to guarantee a fresh store instance per test, combined with `vi.mock('axios')` + `mockResolvedValueOnce`/`mockRejectedValueOnce` (which don't leak between tests when re-wired in each test or reset via `beforeEach(() => vi.clearAllMocks())`). No explicit `sequence.shuffle` config needed — Vitest's default per-file isolation plus fresh Pinia is sufficient.

### getHardCodedValue() and Known Scaffolding
- **D-06:** **Do NOT test** `gameStore.getHardCodedValue()`. It's explicitly flagged in CONVENTIONS.md as an anti-pattern/stub (`getHardCodedValue()` returning `42` — a placeholder; do not imitate). Writing a test for it risks looking like an endorsement of the pattern. Skip it entirely — not a regression target.

### the agent's Discretion
- Exact `describe`/`it` nesting structure within `gameStore.test.js` and `teamStore.test.js` — planner/executor discretion, following `.planning/codebase/TESTING.md`'s example style (flat `describe` per function/action, `it` blocks per branch).
- Whether `gameStore.test.js` and `teamStore.test.js` share a `beforeEach` setup helper or each defines its own — planner discretion, as long as fresh-Pinia-per-test is guaranteed.
- Precise `mockResolvedValueOnce`/`mockRejectedValueOnce` reset strategy (`vi.clearAllMocks()` in `beforeEach` vs `afterEach`) — planner discretion, as long as no mock state leaks between tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 3: Store Unit Tests" — goal, 5 success criteria
- `.planning/REQUIREMENTS.md` §Store Unit Tests — STO-01, STO-02, STO-03, STO-04 (the locked requirements this phase satisfies)

### Codebase Analysis
- `.planning/codebase/TESTING.md` — documented axios-mocking pattern (`vi.mock('axios')`), fresh-Pinia-per-test example, priority ordering
- `.planning/codebase/CONVENTIONS.md` — server-shaped `snake_case` field names (do NOT rename in factories), `getHardCodedValue()` flagged as anti-pattern (do not imitate; do not test)
- `.planning/phases/01-test-foundation/01-CONTEXT.md` — Phase 1 decisions (Vitest config location, jsdom, co-located test files) inherited by this phase
- `.planning/phases/02-domain-unit-tests/02-CONTEXT.md` — Phase 2 precedent (happy-path-first norm) — explicitly overridden by D-02 for this phase's error branches

### Existing Code (test targets — read before writing tests)
- `src/stores/gameStore.js` (392 lines) — Pinia setup store: `fetchGame`, `setLineup`, `getLineup`, `getPlayer`, `getHardCodedValue` (skip), `fetchPlayTypes`, `setDefensivePlay`, `setOffensivePlay`, `setKickoffPlay`, `runPlay`, `fetchPlayResult`, `fetchAllPlayResults`, `fetchGameData`, `setPlayType`, `updateGameStateFromPlayResult`, hover functions (`setHoveredBox`, `clearHover`, `isBoxHighlighted`, `getBoxLabel`)
- `src/stores/teamStore.js` (152 lines) — Pinia setup store: `fetchPlayers`, `toggleManagedTeam`, `selectPlayer`, `removePlayer`, `setTeam`, `getPlayerByIDBothTeams`, `getTeamName`, `getPlayersForBox`, `getPlayersSetInBox`, computed `homeTeam`/`awayTeam`/`availablePlayerIDs`/`allPlayers`

No additional external specs or ADRs — decisions above are complete.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/codebase/TESTING.md`'s Pinia store test example (`vi.mock('axios')`, `setActivePinia(createPinia())` in `beforeEach`) is the direct template for both store test files.
- `src/game/SPFMetadata.js` and `src/game/TeamData.js` (already unit-tested in Phase 2) are imported/used internally by both stores (`spfMetadata.getRelatedPassDefenseBox`, `new TeamData(...)`) — no need to re-test their internals, only that the stores wire them correctly.

### Established Patterns
- Every async store action wraps its `axios` call in `try/catch/finally`; `finally` always resets the matching `is*ing` flag — this is the structural pattern D-03 targets.
- Error message extraction pattern: `err.response ? err.response.data : err.message` (or a slightly older manual variant using `if (err.response) {...} else {...}` with a fixed string) — both variants exist across the two stores' actions; tests must match whichever variant the specific action under test uses.
- Prettier/ESLint conventions apply: no semicolons, single quotes, 2-space indent, print width 100, no trailing commas.

### Integration Points
- New files: `src/stores/gameStore.test.js`, `src/stores/teamStore.test.js` (co-located, per Phase 1 convention).
- New files: `test/factories/gameState.js`, `test/factories/lineup.js`, `test/factories/players.js`.

</code_context>

<specifics>
## Specific Ideas

- `runPlay()` is the one action in the whole codebase that re-throws on network failure (per CONVENTIONS.md's documented anti-pattern-adjacent note) — this is a deliberate exception the test suite must assert on (promise rejects), not treat as a bug.
- `teamStore.js`'s default `team` ref ships with hardcoded seed players (`QB-1`: Joe, `RB-1`: John) — factories should be flexible enough to override this seed shape entirely via `overrides`, not just append to it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Store Unit Tests*
*Context gathered: 2026-07-16*
