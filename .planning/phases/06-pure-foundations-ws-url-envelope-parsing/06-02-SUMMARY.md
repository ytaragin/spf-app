---
phase: 06-pure-foundations-ws-url-envelope-parsing
plan: 02
subsystem: game-domain
tags: [websocket, envelope, pure-module, tdd]
requires: []
provides:
  - "gameEvents.parseEvent — pure { event, data } envelope validator/unwrapper"
affects:
  - "Phase 8 dispatch glue (consumes { event, data } output)"
  - "Phase 9 onmessage handler (uses null return as ignore signal)"
tech-stack:
  added: []
  patterns:
    - "Pure src/game/ module (no Vue/Pinia/axios), defensive never-throws, console.error context logging"
key-files:
  created:
    - src/game/gameEvents.js
    - src/game/gameEvents.test.js
  modified: []
decisions:
  - "D-03: parseEvent treats raw as already-parsed; no JSON.parse"
  - "D-01: valid envelopes pass through as { event, data } — wire naming preserved, data untouched"
  - "D-02: malformed/unknown envelopes return null, never throw"
  - "D-06: rejection logs context phrase + event tag only, never the full payload"
metrics:
  duration: ~5m
  completed: 2026-07-19
status: complete
---

# Phase 6 Plan 2: gameEvents Envelope Parsing Summary

Delivered `gameEvents.parseEvent(raw)` — a pure, Vue-free validator/unwrapper for the tagged `{ event, data }` WebSocket envelope across the 5 known variants (GameStarted, OffensiveLineupSet, DefensiveLineupSet, NextPlayTypeSet, PlayRun), rejecting malformed/unknown envelopes to `null` with a payload-free `console.error` and never throwing.

## What Was Built

- **`src/game/gameEvents.js`** — exports `parseEvent`. Known variants held in a module-level `KNOWN_VARIANTS` Set. Defensive shape validation: rejects non-objects, missing/non-string `event`, missing `data`, and unknown variants. Valid envelopes return `{ event, data }` pass-through with `data` untouched (no `type`/`payload` rename, no reshape). No `JSON.parse`, no Vue/Pinia/axios/store imports.
- **`src/game/gameEvents.test.js`** — zero-mock Vitest suite (12 tests) mirroring `playOutcome.test.js` style. Covers all 5 valid variants, pass-through shape (no type/payload keys), unknown-variant rejection with `console.error` tag assertion, negative assertion that the full payload is not dumped, and all 7 malformed-input cases (null/undefined/number/string/missing event/non-string event/missing data) asserting `null` + never-throws.

## How It Works

`parseEvent` was built TDD-style (RED test commit → GREEN implementation commit). It uses `vi.spyOn(console, 'error')` in tests to assert logging without any DOM/store mocks.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx vitest run src/game/gameEvents.test.js` → 12 passed, exit 0.
- `npx eslint src/game/gameEvents.js src/game/gameEvents.test.js` → clean.
- Grep confirmed no `JSON.parse` and no Vue/Pinia/axios/store imports.

## Self-Check: PASSED

- src/game/gameEvents.js — FOUND
- src/game/gameEvents.test.js — FOUND
- Commit c56c42a (test), 781471d (feat) — present in git log
