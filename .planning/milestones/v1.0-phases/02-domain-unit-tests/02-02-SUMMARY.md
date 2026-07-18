---
phase: 02-domain-unit-tests
plan: 02
subsystem: testing
tags: [vitest, spfmetadata, domain-logic, tech-debt]

# Dependency graph
requires:
  - phase: 01-test-foundation
    provides: Vitest + jsdom + shared setup, no mocking needed for pure src/game/ modules
provides:
  - src/game/SPFMetadata.test.js with sampled + full-coverage assertions
  - .planning/ISSUES.md documenting two known SPFMetadata bugs
affects: [02-03-teamdata-tests, phase-3-store-unit-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-04/D-05 split: representative sampling for simple getters, full coverage for interesting logic methods"
    - "Bug-safe test assertions: document known bugs in ISSUES.md instead of asserting them as correct behavior"

key-files:
  created:
    - src/game/SPFMetadata.test.js
    - .planning/ISSUES.md
  modified: []

key-decisions:
  - "Used a single shared `const meta = new SPFMetadata()` at describe scope since the class is stateless/read-only"
  - "Did not assert getBoxLabel('le') === 'LE' (D-07 case-mismatch bug) — tested only working box_* label keys"
  - "Did not assert code field for InsideRun/InsideRight (D-07 duplicate code:'IR' bug) — tested description/boxes only"

patterns-established:
  - "Tech-debt bugs found during testing get documented in .planning/ISSUES.md, not fixed and not laundered into passing assertions"

requirements-completed: [DOM-02]

coverage:
  - id: D1
    description: "SPFMetadata.js box↔position mapping and label helpers are tested and pass green"
    requirement: "DOM-02"
    verification:
      - kind: unit
        ref: "src/game/SPFMetadata.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two known SPFMetadata bugs (D-07) documented as tech debt, not fixed, not asserted as correct"
    verification:
      - kind: other
        ref: ".planning/ISSUES.md"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 2 Plan 2: SPFMetadata.test.js + ISSUES.md Summary

**Full test coverage of SPFMetadata.js box/position/play metadata helpers with two known bugs documented as tech debt rather than fixed or asserted as correct**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-14T09:11:15Z
- **Completed:** 2026-07-14T09:13:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 19 passing tests in `src/game/SPFMetadata.test.js` covering all 9 public methods, sampled for simple getters (D-04) and full coverage for `getRelatedPassDefenseBox`/`getBoxLayoutForPlay` (D-05)
- New `.planning/ISSUES.md` documenting the `InsideRun`/`InsideRight` duplicate `code: 'IR'` bug and the `getBoxLabel` lowercase-key case-mismatch bug, both explicitly flagged as "not fixed in this milestone"
- No mocking, no test-setup dependency — pure `@/game/SPFMetadata.js` import only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SPFMetadata.test.js with sampled + full-coverage assertions** - `690737e` (test)
2. **Task 2: Document known SPFMetadata bugs as tech debt in ISSUES.md** - `4a8f6f9` (docs)

**Plan metadata:** (pending — commit after this file)

## Files Created/Modified
- `src/game/SPFMetadata.test.js` - New test file: `getBoxLabel`, `getPositionForABox`, `getPositionMetaData`, `getOffensivePlayNames`, `getDefensivePlayNames`, `getOffensePlayInfo`, `getDefensePlayInfo`, `getRelatedPassDefenseBox`, `getBoxLayoutForPlay`
- `.planning/ISSUES.md` - New tech-debt doc: two SPFMetadata bugs (duplicate code, label case-mismatch)

## Decisions Made
- Shared a single `SPFMetadata` instance across all tests in the describe block (class is stateless/read-only, so no isolation risk)
- Asserted array contents (`toEqual`) rather than relying on shared-reference object identity for `positions` arrays, per CONTEXT.md specifics note

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SPFMetadata.js fully covered per DOM-02; ready for 02-03 (TeamData.test.js)
- Both known SPFMetadata bugs documented for future consideration outside this milestone
- No blockers

---
*Phase: 02-domain-unit-tests*
*Completed: 2026-07-14*

## Self-Check: PASSED
