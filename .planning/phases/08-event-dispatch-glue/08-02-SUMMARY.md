---
phase: 08-event-dispatch-glue
plan: 02
subsystem: game-events
tags: [websocket, dispatch, store, reducer, lineups, tdd]
requires:
  - src/game/gameStateReducer.js (applyGameState — Phase 7 keystone)
  - src/game/gameEventDispatch.js (dispatchEvent + makeFakeStore — plan 08-01)
provides:
  - applyIncomingGameState(state) — gameStore local-apply action (reused by Phase 9 GET /state resync)
  - applyLineup(side, lineup) — gameStore local-apply action, single write site for lineups[side]
  - dispatchEvent GameStarted / OffensiveLineupSet / DefensiveLineupSet branches
affects:
  - src/stores/gameStore.js (fetchGame, setLineup, getLineup now delegate)
tech-stack:
  added: []
  patterns:
    - generically-named apply* wrapper so a future resync path reuses one write site
    - shared private isPayloadObject guard with variant-specific log messages
key-files:
  created: []
  modified:
    - src/stores/gameStore.js
    - src/stores/gameStore.test.js
    - src/game/gameEventDispatch.js
    - src/game/gameEventDispatch.test.js
decisions:
  - D-16 GameStarted routes to its own reducer wrapper, never through applyPlayResult
  - D-17 GameStarted performs zero collateral resets
  - D-06 lineups[side] has exactly one write site, shared by REST and WS
  - side is always an offense/defense literal chosen in dispatch, never payload-derived
metrics:
  duration: ~15m
  completed: 2026-08-28
status: complete
---

# Phase 8 Plan 02: GameStarted and Lineup Dispatch Slice Summary

Extends the WebSocket slice from one variant to four: `GameStarted` now lands through the Phase 7
monotonic reducer via a new generically-named `applyIncomingGameState` wrapper, and both lineup
variants land through a single `applyLineup(side, lineup)` action that the two existing REST call
sites were refactored onto.

## What Was Built

### `src/stores/gameStore.js` (modified)

Two new local-apply actions, both JSDoc-marked **local-apply only — does not POST** (D-07) and both
exported inside the existing `// Local-apply actions (do not POST)` group:

- **`applyIncomingGameState(state)`** — captures the previous `gameState` reference, runs
  `applyGameState`, assigns, and returns `applied !== previous`. Named generically rather than
  `applyGameStarted` because Phase 9's `GET /state` resync reuses it. Performs **no collateral
  resets** — `playResults`, `lineups`, `nextPlayType`, and `lineupSubmitted` are untouched (D-17).
- **`applyLineup(side, lineup)`** — a single `lineups.value[side] = lineup` assignment. The
  `(side, lineup)` signature makes both REST call sites a direct pass-through, since each already
  computed an `'offense'`/`'defense'` local (`func`, `team`).

Three call sites refactored so each field has exactly one write site (D-06): `fetchGame` →
`applyIncomingGameState(response.data)`; `setLineup` → `applyLineup(func, lineup)`; `getLineup` →
`applyLineup(team, response.data)`. `updateGameStateFromPlayResult` was left byte-identical, as
08-01 Task 3 requires.

### `src/game/gameEventDispatch.js` (modified)

Three new branches matching the PlayRun branch's guard-clause shape, plus a small non-exported
`isPayloadObject(value)` helper placed above `dispatchEvent` (mirroring `gameStateReducer.js`'s
private-helper-above-export layout). Each branch keeps its own variant-specific log message so the
event tag always appears in output.

- `GameStarted` → `store.applyIncomingGameState(data) === true`. Explicitly **not** wrapped as
  `{ new_state: data }` and never routed through `applyPlayResult` (D-16), so no play-less object
  can reach `playResults` and no `lineupSubmitted` reset is tripped.
- `OffensiveLineupSet` / `DefensiveLineupSet` → `store.applyLineup('offense'|'defense', data)`,
  returning `true`. The side is a literal chosen here, never read from the payload, so no
  attacker-controlled key (including `__proto__`) is writable (T-08-08).

The module still has zero imports, no async/network primitives, and no reachable `store.set*` action.

### Tests (both suites extended, TDD)

`gameStore.test.js`: `describe('applyIncomingGameState (local-apply, no POST)')` (4 tests — apply,
duplicate same-reference, stale, no-collateral-resets) and `describe('applyLineup (local-apply, no
POST)')` (3 tests — per-side storage, side isolation via an offense-only `RB` observed through
`getPlayer`, idempotent repeat). No axios mocking needed.

`gameEventDispatch.test.js`: `describe('dispatchEvent — GameStarted')` (4), `describe('dispatchEvent
— lineup variants')` (3), and a table-driven `describe('dispatchEvent — malformed data for the state
and lineup variants')` (15 — 3 tags × 4 bad payloads + 3 no-leak assertions). Reused the existing
module-scope `makeFakeStore(overrides)` unchanged; the deferred-variants list shrank to
`NextPlayTypeSet` only.

## Verification

| Command | Result |
|---------|--------|
| `npm test` | **exit 0** — 12 files, 183 tests passed (was 157) |
| `npx vitest run src/stores/gameStore.test.js` | exit 0 — 41 passed |
| `npx vitest run src/game/gameEventDispatch.test.js` | exit 0 — 40 passed |
| `npx prettier --check` (all 4 files) | **exit 0** |
| `npx eslint` (all 4 files) | **exit 0** |
| `npm run lint` | exit 1 — same 7 pre-existing errors as 08-01, none in this plan's files |

Acceptance greps, all as specified:

```
grep -c 'applyGameState('                        src/stores/gameStore.js  → 2
sed -n '/async function fetchGame()/,/^  }/p' | grep -c 'applyGameState(' → 0
grep -c 'lineups.value\[[a-z]*\] ='              src/stores/gameStore.js  → 1
grep -c 'new_state: data'                src/game/gameEventDispatch.js    → 0
grep -c '^import '                       src/game/gameEventDispatch.js    → 0
grep -c 'axios\|fetch(\|await \|async '  src/game/gameEventDispatch.js    → 0
grep -c 'store\.set[A-Z]'                src/game/gameEventDispatch.js    → 0
```

The pre-existing `setLineup`, `getLineup`, `fetchGame`, and `fetchPlayResult` cases are all still
green after the refactor.

## Deviations from Plan

### Deferred-variant test list narrowed (required, not optional)

Plan 08-01's `variants deferred to plans 08-02 / 08-03` block looped over all four unimplemented
tags asserting `dispatchEvent(store, { event, data: {} })` returns `false`. Three of those tags are
implemented by this plan and `{}` is a valid payload object, so those cases would now legitimately
return `true`. The list was reduced to `['NextPlayTypeSet']` — the only genuinely still-deferred
variant (plan 08-03). This is the intended handoff, not a weakened assertion: the three removed tags
are now covered far more thoroughly by the new per-variant describes.

### Pre-existing lint failure (out of scope, not fixed)

Unchanged from 08-01: `npm run lint` exits 1 with 7 errors in untouched files
(`vue/multi-word-component-names` ×3, `test/setup.js` `globalThis`/`no-undef` ×4). Per the scope
boundary these were left alone; `npx eslint` scoped to this plan's four files exits 0.

No architectural deviations. No auth gates. No Rule 4 escalations. No Rule 1/2/3 auto-fixes needed.

## Known Stubs

None. `NextPlayTypeSet` falling through to the unknown-tag `default` is the plan's explicit scope
boundary (plan 08-03 implements it), and the fall-through is deliberately tested.

## Threat Flags

None. All six registered threats for this plan are satisfied and test-asserted:

- **T-08-07** — `GameStarted` data validated as a non-null object, then gated by `applyGameState`;
  a forged stale counter cannot regress `gameState` (duplicate/stale tests assert exact-reference).
- **T-08-08** — `side` is an inline literal in `dispatchEvent`, never payload-derived.
- **T-08-09** — non-object lineup `data` rejected with zero store calls (12 table-driven cases).
- **T-08-10** — logs interpolate only the tag and a `typeof`; asserted by three
  `.not.toContain('top-secret-value')` cases.
- **T-08-11** — `grep -c 'store\.set[A-Z]'` returns 0.
- **T-08-12** — accepted (client-side SPA, `console.error` breadcrumb sufficient).

## Self-Check: PASSED

- FOUND: `src/stores/gameStore.js`
- FOUND: `src/game/gameEventDispatch.js`
- FOUND: commit `71fbd5d` (test, RED — store actions)
- FOUND: commit `356843f` (feat, GREEN — store actions)
- FOUND: commit `00ca4e4` (test, RED — dispatch branches)
- FOUND: commit `c67973e` (feat, GREEN — dispatch branches)

## TDD Gate Compliance

Full RED → GREEN sequence observed twice, once per task. Task 1: `71fbd5d` failed with 7
`store.applyIncomingGameState is not a function` / `store.applyLineup is not a function` errors, then
`356843f` turned all 41 green. Task 2: `00ca4e4` failed with 5 routing assertions (the malformed-data
cases already passed via the `default` branch, correctly), then `c67973e` turned all 40 green. No
REFACTOR commit was needed — the shared `isPayloadObject` helper was introduced during GREEN.
