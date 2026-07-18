---
phase: 03-store-unit-tests
plan: 01
subsystem: testing
tags: [vitest, factories, fixtures, pinia, test-data]

requires:
  - phase: 01-test-foundation
    provides: Vitest config, jsdom environment, @ alias, test/setup.js
  - phase: 02-domain-unit-tests
    provides: TeamData unit tests establishing test style conventions
provides:
  - Reusable buildGameState() factory (backend snake_case gameState shape)
  - Reusable buildLineup() factory (offense/defense lineup map)
  - Reusable buildPlayer()/buildRoster() factories (TeamData-consumable roster)
  - Vitest include glob extended to cover test/ directory
affects: [store-unit-tests, component-tests, e2e-tests]

tech-stack:
  added: []
  patterns:
    - "Factories return backend-shaped payloads with overrides spread last for per-test customization"
    - "buildRoster overrides replace the players map wholesale (not merged)"

key-files:
  created:
    - test/factories/gameState.js
    - test/factories/lineup.js
    - test/factories/players.js
    - test/factories/factories.test.js
  modified:
    - vite.config.js

key-decisions:
  - "Factory files live in test/factories/ (D-04); vitest include glob extended to test/** so they are runnable"
  - "buildRoster returns the full { team, availablePlayers, players } wrapping shape TeamData consumes"

patterns-established:
  - "Overrides object spread last: callers override only the fields they care about"
  - "Player records always carry name/id/position (position required by TeamData.getPlayersForPositions)"

requirements-completed: [STO-04]

coverage:
  - id: D1
    description: "buildGameState() returns the default backend snake_case gameState shape with per-field overrides"
    requirement: STO-04
    verification:
      - kind: unit
        ref: "test/factories/factories.test.js#buildGameState returns the default snake_case gameState shape"
        status: pass
    human_judgment: false
  - id: D2
    description: "buildLineup() returns an offense/defense lineup map with override merge"
    requirement: STO-04
    verification:
      - kind: unit
        ref: "test/factories/factories.test.js#buildLineup returns a lineup object"
        status: pass
    human_judgment: false
  - id: D3
    description: "buildPlayer()/buildRoster() produce TeamData-consumable records; new TeamData(buildRoster()) does not throw"
    requirement: STO-04
    verification:
      - kind: unit
        ref: "test/factories/factories.test.js#buildRoster constructs a TeamData without throwing and exposes the seeded ids"
        status: pass
    human_judgment: false
  - id: D4
    description: "Vitest include glob covers test/ directory so factory tests are discoverable"
    requirement: STO-04
    verification:
      - kind: unit
        ref: "npx vitest run test/factories/factories.test.js"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-16
status: complete
---

# Phase 3 Plan 01: Test Factories Summary

**Reusable backend-shaped test factories (buildGameState, buildLineup, buildPlayer/buildRoster) in test/factories/, consumable by store, component, and E2E test layers**

## Performance

- **Duration:** ~8 min
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Three factory modules producing backend snake_case seed data with per-test override support
- Vitest include glob extended to `test/**` so the growing `test/` directory is runnable
- Smoke test (7 tests) proving all factories produce consumable shapes, including `new TeamData(buildRoster())`

## Task Commits

1. **Task 1: Create the three factory modules** - `c03e8c7` (feat)
2. **Task 2: Extend vitest include glob** - `fd7e551` (test)
3. **Task 3: Add factories smoke test** - `d3c8b39` (test)

## Files Created/Modified
- `test/factories/gameState.js` - buildGameState(overrides) returning default gameState ref shape
- `test/factories/lineup.js` - buildLineup(overrides) returning offense/defense lineup map
- `test/factories/players.js` - buildPlayer/buildRoster returning TeamData-shaped roster
- `test/factories/factories.test.js` - smoke test for all three factories
- `vite.config.js` - test.include glob extended to cover test/**

## Decisions Made
- None beyond plan — executed D-04 factory contract as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. (Note: `npx prettier --check vite.config.js` reports a pre-existing style issue in the `plugins` array, unrelated to and outside the scope of the single include-array edit — left untouched per scope boundary.)

## Next Phase Readiness
- Factories ready for consumption by plans 03-02 (gameStore tests) and 03-03 (teamStore tests).

---
*Phase: 03-store-unit-tests*
*Completed: 2026-07-16*
