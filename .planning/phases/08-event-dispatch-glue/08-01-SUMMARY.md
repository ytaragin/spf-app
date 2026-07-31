---
phase: 08-event-dispatch-glue
plan: 01
subsystem: game-events
tags: [websocket, dispatch, store, reducer, tdd]
requires:
  - src/game/gameStateReducer.js (applyGameState — Phase 7 keystone)
  - src/game/gameEvents.js (parseEvent envelope contract — Phase 6)
provides:
  - dispatchEvent(store, event) — pure WS event router (PlayRun branch)
  - applyPlayResult(playAndState) — gameStore local-apply action
affects:
  - src/stores/gameStore.js (fetchPlayResult now delegates)
tech-stack:
  added: []
  patterns:
    - zero-mock fake store (plain arrow recorders, no vi.fn) — new for this repo
    - store injection into a pure src/game/ module
key-files:
  created:
    - src/game/gameEventDispatch.js
    - src/game/gameEventDispatch.test.js
  modified:
    - src/stores/gameStore.js
    - src/stores/gameStore.test.js
decisions:
  - D-01 store injected, not imported — tests use a plain fake object
  - D-09 PlayRun codes strictly to data.new_state, no bare-data fallback
  - D-12 REST and WS share one apply+push path via applyPlayResult
  - D-14 lineupSubmitted reset gated on the reducer verdict — zero-op stays a zero-op
metrics:
  duration: ~20m
  completed: 2026-07-31
status: complete
---

# Phase 8 Plan 01: PlayRun Dispatch Slice Summary

First end-to-end vertical slice of the WebSocket event path: a `PlayRun` envelope routes through a
new pure `dispatchEvent` router into a new `applyPlayResult` store action, funnelling the carried
`GameState` through the Phase 7 monotonic reducer and pushing onto `playResults` only when the
reducer actually advanced.

## What Was Built

### `src/game/gameEventDispatch.js` (new)

`dispatchEvent(store, event)` — a pure, **zero-import** router. Validates the envelope (non-null
object, string `event` tag), then routes on the tag. Only the `PlayRun` branch is implemented; the
other four variants fall through to the unknown-tag `default` (plans 08-02 / 08-03 add them).

The `PlayRun` branch strictly requires `data` and `data.new_state` to be non-null objects (D-09, no
bare-`data` fallback). On any mismatch it emits a `console.error` interpolating only the event tag
and/or a `typeof` — never the payload — and returns `false` with **zero store actions called**
(D-08). On success it returns `store.applyPlayResult(data) === true`, deriving the boolean purely
from the store action's own reducer-derived verdict (D-03, D-14).

No `async`/`await`, no `throw`, no network I/O, no `JSON.stringify`, no `store.set*` call.

### `src/game/gameEventDispatch.test.js` (new)

21 tests against a `makeFakeStore(overrides)` helper — a plain object with a `calls` array and four
arrow-function recorders. **No `vi.fn()` anywhere**, per the zero-mock convention (D-01). This is a
genuinely new pattern for the repo; every prior store test used a real Pinia instance plus
`vi.mock('axios')`.

Coverage: successful apply (whole `PlayAndState` forwarded, not just `new_state`), reducer-no-op
`false` return, duplicate delivery, a table-driven invalid-`new_state` matrix, a table-driven
malformed-envelope matrix, the no-payload-leak assertion, and the four deferred variants.

### `src/stores/gameStore.js` (modified)

Added `applyPlayResult(playAndState)` immediately above `fetchPlayResult` — the literal extraction
of the latter's apply+push body, plus the D-13 `lineupSubmitted = false` reset. It wraps the
**unchanged** `updateGameStateFromPlayResult` and returns its boolean. `fetchPlayResult`'s body is
now just `applyPlayResult(newPlay)`, so REST and WS share exactly one write path (D-12).

Exported under a new `// Local-apply actions (do not POST)` grouping comment (D-07), which plans
08-02 / 08-03 append to.

### `src/stores/gameStore.test.js` (modified)

Added a `describe('applyPlayResult (local-apply, no POST)')` block (6 tests) covering apply, duplicate,
stale, the D-13 reset, the D-14 zero-op non-collapse, and the missing-`new_state` case. No axios
mocking needed — `applyPlayResult` performs no I/O.

## Verification

| Command | Result |
|---------|--------|
| `npm test` | **exit 0** — 12 files, 157 tests passed |
| `npx vitest run src/game/gameEventDispatch.test.js` | exit 0 — 21 passed |
| `npx vitest run src/stores/gameStore.test.js` | exit 0 — 34 passed (4 pre-existing `fetchPlayResult` cases still green) |
| `npx prettier --check` (all 4 files) | **exit 0** |
| `npm run lint` | exit 1 — **7 pre-existing errors, none in this plan's files** (see Deviations) |
| `npx eslint` (this plan's 4 files) | **exit 0** |

Acceptance greps, all as specified:

```
grep -c 'vi\.fn('                src/game/gameEventDispatch.test.js  → 0
grep -c '^import '               src/game/gameEventDispatch.js       → 0
grep -c 'axios\|fetch(\|await \|async ' src/game/gameEventDispatch.js → 0
grep -v '^\s*\*' … | grep -c 'throw '                                → 0
grep -c 'JSON.stringify'         src/game/gameEventDispatch.js       → 0
grep -c 'store\.set[A-Z]'        src/game/gameEventDispatch.js       → 0
grep -A 8 'async function fetchPlayResult' … | grep -c 'playResults.value.push' → 0
```

`git diff -U0 src/stores/gameStore.js` confirms **no changed line inside**
`updateGameStateFromPlayResult` — its silent `return false` is preserved, as the existing store test
depends on it.

## Deviations from Plan

### Pre-existing lint failure (out of scope, not fixed)

`npm run lint` exits 1 with 7 errors, all in files this plan never touched:

- `src/components/Basic.vue`, `src/components/players/K.vue`, `src/components/players/Plain.vue` —
  `vue/multi-word-component-names`
- `test/setup.js` (×4) — `'globalThis' is not defined` / `no-undef`

`test/setup.js` is unchanged since commit `df6640d` (phase 01), and the three components are
likewise untouched. `npx eslint` scoped to this plan's four files exits 0. Per the scope boundary
(only auto-fix issues directly caused by the current task's changes), these were left alone rather
than silently fixed. **Recommended minimal fix for a follow-up:** add `env: { es2022: true }` or a
`globalThis` global to `.eslintrc.cjs`, and add a `vue/multi-word-component-names` ignore entry for
the three single-word components.

### Two cosmetic self-corrections during execution

Both were caught by the plan's own acceptance greps and fixed by rewording comments, no logic change:

1. A test comment reading "Deliberately NOT `vi.fn()`" made `grep -c 'vi\.fn('` return 1 instead of 0.
2. A JSDoc header phrase "no Vue/store/axios imports" made the `axios\|fetch(\|await \|async ` grep
   return 1 instead of 0.

No architectural deviations. No auth gates. No Rule 4 escalations.

## Known Stubs

None. The four non-`PlayRun` variants falling through to `default` is the plan's explicit scope
boundary (plans 08-02 and 08-03 implement them), not an unwired stub — the fall-through is
deliberately tested.

## Threat Flags

None. No new security-relevant surface beyond the `dispatchEvent` trust boundary already registered
in the plan's threat model (T-08-01 through T-08-06, all `mitigate` dispositions satisfied and
asserted by tests).

## Self-Check: PASSED

- FOUND: `src/game/gameEventDispatch.js`
- FOUND: `src/game/gameEventDispatch.test.js`
- FOUND: commit `fe0eaa0` (test, RED)
- FOUND: commit `337bc1b` (feat, GREEN)
- FOUND: commit `f0c1219` (refactor, GREEN)

## TDD Gate Compliance

Full RED → GREEN sequence observed: `test(08-01)` at `fe0eaa0` failed with a module-resolution error
for the absent `gameEventDispatch.js`, then `feat(08-01)` at `337bc1b` turned all 21 tests green.
`refactor(08-01)` at `f0c1219` completed the store extraction with the suite staying green.
