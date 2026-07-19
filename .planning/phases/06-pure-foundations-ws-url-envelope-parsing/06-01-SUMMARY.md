---
phase: 06-pure-foundations-ws-url-envelope-parsing
plan: 01
subsystem: testing
tags: [websocket, url, vitest, pure-module, vue3]

requires:
  - phase: existing-codebase
    provides: playOutcome.js pure-module + zero-mock Vitest pattern to mirror
provides:
  - toWebSocketUrl(baseUrl) pure function deriving ws/wss URL from REST base URL
  - Colocated zero-mock Vitest suite for gameSocketUrl
affects: [09-usegamesocket-composable, realtime-websocket]

tech-stack:
  added: []
  patterns:
    - "Pure src/game/ module: no Vue/Pinia/axios/import.meta imports; base URL passed in by caller"
    - "Fail-loud (D-05): throw on invalid input, never return null"

key-files:
  created:
    - src/game/gameSocketUrl.js
    - src/game/gameSocketUrl.test.js
  modified: []

key-decisions:
  - "Used platform URL constructor for host/port/path handling (D-04)"
  - "Rejected non-http(s) protocols explicitly to fail loud (D-05)"

patterns-established:
  - "WS URL derivation is a zero-dependency pure module consumed by future composables"

requirements-completed: [WS-01]

coverage:
  - id: D1
    description: "toWebSocketUrl derives ws://wss:// URL with /game/ws path from a REST base URL, preserving host+port, tolerating trailing slashes, and failing loud on invalid input"
    requirement: "WS-01"
    verification:
      - kind: unit
        ref: "src/game/gameSocketUrl.test.js#toWebSocketUrl"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-19
status: complete
---

# Phase 06 Plan 01: toWebSocketUrl Pure Module Summary

**Pure Vue-free `toWebSocketUrl(baseUrl)` deriving ws://wss:// realtime URLs (with `/game/ws` path) from the REST base URL via the platform URL constructor, failing loud on invalid input.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 1 (TDD)
- **Files modified:** 2 (both created)

## Accomplishments
- `toWebSocketUrl` maps `http:`→`ws:` and `https:`→`wss:`, preserving host+port
- Sets pathname to `/game/ws`, replacing existing paths and normalizing trailing slashes via the URL constructor
- Fails loud (D-05) on empty, unparseable, null/undefined, or non-http(s) input — never returns null
- Introduces no new env var; base URL is passed in by the caller (the same `VITE_API_BASE_URL` gameStore reads)
- Colocated zero-mock Vitest suite (9 tests) mirroring `playOutcome.test.js`

## Task Commits

1. **Task 1: Implement toWebSocketUrl pure module** - `7204326` (feat, TDD)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `src/game/gameSocketUrl.js` - Pure `toWebSocketUrl` WS URL derivation
- `src/game/gameSocketUrl.test.js` - Zero-mock Vitest suite covering all five behaviors

## Decisions Made
None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `toWebSocketUrl` ready for consumption by the Phase 9 `useGameSocket` composable.
- No blockers.

## Self-Check: PASSED

- `src/game/gameSocketUrl.js` — FOUND
- `src/game/gameSocketUrl.test.js` — FOUND
- Commit `7204326` — FOUND
- `npx vitest run src/game/gameSocketUrl.test.js` — 9 passed, exit 0

---
*Phase: 06-pure-foundations-ws-url-envelope-parsing*
*Completed: 2026-07-19*
