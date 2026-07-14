# Phase 2: Domain Unit Tests - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Unit-test the three pure `src/game/` modules — `playOutcome.js`, `SPFMetadata.js`, `TeamData.js` — with zero mocking. Deliverable: a fast, mock-free domain test suite that locks down existing behavior (classification, box/position mapping, roster assignment) as a regression baseline. Writing store/component/E2E tests belongs to Phases 3–5; refactoring app source is out of scope for this entire milestone.

</domain>

<decisions>
## Implementation Decisions

### Existing Proving Test Disposition
- **D-01:** `src/game/playOutcome.test.js` already contains 2 tests from Phase 1 (`outcomeColor` favorable case, `isTurnover`). **Expand this file in place** — do not delete/replace the existing tests. Add the rest of the `playOutcome` suite (organized as nested `describe` blocks per function) into this same file.

### playOutcome.js Coverage
- **D-02:** Test `outcomeColor`/`classifyOutcome` with **both `favorable: true` (default) and `favorable: false`** explicitly — perspective inversion is the core domain behavior per the file's JSDoc, not a symmetric afterthought. Also cover `managedTeamHadPossession` for a matching team (offense) and a mismatched team (defense/inverted).
- **D-03:** **Happy-path only** for defensive-coding branches — do NOT write dedicated tests for null/undefined `result`, missing `result_type`, non-numeric `result` strings, or `managedTeamHadPossession` with null `play`/`managedTeam`. These optional-chaining/default fallbacks exist for safety but are not required test targets this phase.

### SPFMetadata.js Test Structure
- **D-04:** For simple getters over static box/play data (`getBoxLabel`, `getPositionForABox`, `getPositionMetaData`, `getOffensivePlayNames`, `getDefensivePlayNames`, `getOffensePlayInfo`, `getDefensePlayInfo`) — test with **representative samples**, not exhaustive enumeration. One box per row-type (e.g. `box_a` for defRow1, `box_f` for defRow2, `box_k`/`box_l` for defRow3 variants) and one offensive box per group (`le`/`lt`/`qb`/`fl1`/`b1`/`k`/`kr`). Do not loop over all 15 defensive + 14 offensive boxes — that tests data, not logic.
- **D-05:** For the "interesting" logic methods, go **full coverage**:
  - `getRelatedPassDefenseBox` — test both directions of the bidirectional lookup (a box that guards another, and a box that is guarded), plus a box with no pass-defense relationship at all (returns `null`).
  - `getBoxLayoutForPlay` — test the `'kickoff'` branch (case-insensitive match) and the default branch (any other play name), confirming each returns the right `{ offense, defense }` box-layout shape.

### TeamData.js Coverage
- **D-06:** Happy-path only, matching D-03 — no dedicated tests for unknown player IDs, double-assign, or double-reset edge cases. Cover `assignPlayer`/`resetPlayer`/`resetAllPlayers`/`getPlayersForPositions`/`availablePlayerIDs`/`allPlayers`/`teamName` for their documented, expected-input behavior.

### Known Bugs/Quirks in SPFMetadata (flag, don't fix, don't test)
- **D-07:** Two bugs were found during discussion and are explicitly **out of scope to fix or assert on**:
  1. `InsideRun` and `InsideRight` share the duplicate `code: 'IR'` (likely copy-paste bug in `offensivePlays`).
  2. `getBoxLabel('le')` (and other lowercase offensive-box keys) never matches the `labels.LE`/`labels.K`/`labels.KR` entries (case mismatch) — falls back to returning the raw key.
  - Tests must **not assert on the `code` field** for `InsideRun`/`InsideRight` (test `description`/`boxes` only for those two). Tests must **not assert** that `getBoxLabel('le')` returns `'LE'` — test it against boxes that DO have working label entries (the `box_*` keys).
  - **Action required:** these two issues must be written up in an Issues/tech-debt doc (not fixed in code, not silently encoded as "correct" behavior in test assertions).

### the agent's Discretion
- Exact test file naming/organization within `SPFMetadata.test.js` and `TeamData.test.js` (nested `describe` grouping) — planner/executor discretion, following the existing `playOutcome.test.js` style (flat `describe` + `it` blocks).
- Precise representative-box choices for D-04 sampling beyond the ones named above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 2: Domain Unit Tests" — goal, 4 success criteria
- `.planning/REQUIREMENTS.md` §Domain Unit Tests — DOM-01, DOM-02, DOM-03 (the locked requirements this phase satisfies)

### Codebase Analysis
- `.planning/codebase/TESTING.md` — recommended patterns for pure-function tests, priority order (playOutcome first), mocking guidance (do NOT mock `src/game/`)
- `.planning/phases/01-test-foundation/01-CONTEXT.md` — Phase 1 decisions (Vitest config location, jsdom, co-located test files, Vue plugin versions) that this phase inherits

### Existing Code (test targets — read before writing tests)
- `src/game/playOutcome.js` (104 lines) — `isTurnover`, `netYards`, `outcomeIcon`, `outcomeLabel`, `outcomeSummary`, `outcomeColor`, `classifyOutcome`, `managedTeamHadPossession`
- `src/game/SPFMetadata.js` (295 lines) — box/position/play metadata class, 15 methods including `getRelatedPassDefenseBox`, `getBoxLayoutForPlay`
- `src/game/TeamData.js` (62 lines) — roster model: `assignPlayer`, `resetPlayer`, `resetAllPlayers`, `getPlayersForPositions`, `availablePlayerIDs`, `allPlayers`, `teamName`, `getPlayerByID`

### Existing Test File (expand, don't replace)
- `src/game/playOutcome.test.js` — 2 existing tests from Phase 1's proving test; D-01 requires expanding this file in place.

No additional external specs or ADRs — decisions above are complete.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/game/playOutcome.test.js` — already has the Vitest import pattern (`import { describe, it, expect } from 'vitest'`) and `@/game/...` alias usage established in Phase 1; new domain test files should mirror this style.
- Vitest config (merged into `vite.config.js` per Phase 1 D-01) and `test/setup.js` already exist — this phase needs neither, since these are pure functions/classes with no DOM/Vuetify dependency.

### Established Patterns
- Pure, dependency-free modules — no mocking needed anywhere in this phase (confirmed: `playOutcome.js` has no imports at all; `SPFMetadata.js` and `TeamData.js` are plain ES classes with no external deps).
- Prettier/ESLint conventions apply: no semicolons, single quotes, 2-space indent, print width 100, no trailing commas.

### Integration Points
- New files: `src/game/SPFMetadata.test.js`, `src/game/TeamData.test.js` (co-located per Phase 1 D-03).
- Expanded file: `src/game/playOutcome.test.js` (add to existing file, per D-01).

</code_context>

<specifics>
## Specific Ideas

- `SPFMetadata` constructor builds nested objects (`defRow1`, `offLine`, `qb`, `backs`, `end`, `flanker`, `kicker`, `kickReturner`) that are shared by reference across multiple box keys (e.g. `box_a` through `box_e` all point to the same `defRow1` object). Tests should assert on the returned `positions` array contents, not object identity.
- Two known bugs documented under D-07 need to be written up in an Issues/tech-debt tracking doc as part of this phase's deliverables (exact doc location/format is planner discretion — e.g., a new `.planning/ISSUES.md` or a note appended to STATE.md's "Blockers/Concerns").

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The two SPFMetadata bugs found (D-07) are documented as tech debt to flag, not fixed in this milestone (consistent with PROJECT.md's "no source refactor" constraint), and are not deferred to a future phase — they're simply out of scope entirely.

</deferred>

---

*Phase: 2-Domain Unit Tests*
*Context gathered: 2026-07-14*
