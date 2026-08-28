---
phase: 08-event-dispatch-glue
plan: 03
subsystem: game-events
tags: [websocket, dispatch, store, play-type, tdd, phase-close]
requires:
  - src/game/gameEventDispatch.js (dispatchEvent + makeFakeStore — plan 08-01)
  - src/stores/gameStore.js (applyPlayResult, applyIncomingGameState, applyLineup — plans 08-01/08-02)
provides:
  - applyNextPlayType(type) — gameStore local-apply action, single write site for nextPlayType
  - dispatchEvent NextPlayTypeSet branch — the fifth and final EVT-02 variant
  - 5-variant completeness assertion tying dispatchEvent to KNOWN_VARIANTS
affects:
  - src/stores/gameStore.js (fetchPlayTypes success + error paths, setPlayType now delegate)
tech-stack:
  added: []
  patterns:
    - dispatch forwards the raw payload; the store action owns the single normalization implementation
    - locally-declared variant table asserted at length 5 to make KNOWN_VARIANTS drift visible
key-files:
  created: []
  modified:
    - src/stores/gameStore.js
    - src/stores/gameStore.test.js
    - src/game/gameEventDispatch.js
    - src/game/gameEventDispatch.test.js
decisions:
  - applyNextPlayType owns only nextPlayType; playTypes keeps its inline assignments (single caller)
  - setPlayType gains an additive optimistic local write — a behavior change, not a mechanical extraction
  - normalization lives in the store action only; dispatch passes data through unchanged
  - D-13 fallback NOT taken — the reset is already correctly gated by the reducer verdict
metrics:
  duration: ~20m
  completed: 2026-08-28
status: complete
---

# Phase 8 Plan 03: NextPlayTypeSet and Phase Close Summary

Closes the phase by wiring the fifth and final WebSocket variant (`NextPlayTypeSet`) end to end
through a new `applyNextPlayType` store action, asserting `dispatchEvent`'s branch set matches
`KNOWN_VARIANTS` exactly, and discharging the recorded D-13 `lineupSubmitted` redundancy risk with
tests rather than the documented fallback.

## What Was Built

### `src/stores/gameStore.js` (modified)

**`applyNextPlayType(type)`** — a new local-apply action, JSDoc-marked **local-apply only — does not
POST** (D-07) and exported in the `// Local-apply actions (do not POST)` group. Normalization, in
order: a non-empty string is used as-is; else a non-null object with a string `next_type` yields
`type.next_type` (D-10 tolerance for the `/game/nexttype` response shape); else `null`. The result is
computed into a local `normalized` and written in **exactly one terminal assignment**, so
`nextPlayType.value =` appears once in the whole file. The server-shaped `snake_case` `next_type`
field name is preserved, not renamed.

Two scope decisions were recorded inline as the plan required:

- **`applyNextPlayType` owns only `nextPlayType`.** `playTypes` keeps its existing inline assignments
  in `fetchPlayTypes` — it already has a single write site, so extracting it would add an action with
  no second caller.
- **`setPlayType` routes through `applyNextPlayType` anyway.** It did not previously write
  `nextPlayType` at all, so this is an **additive optimistic local write**, not a mechanical
  extraction — see Deviations below.

Three call sites refactored (D-06): `fetchPlayTypes` success → `applyNextPlayType(response.data.next_type)`;
`fetchPlayTypes` error reset → `applyNextPlayType(null)` (behavior preserved exactly, with
`playTypes.value = []` left inline); `setPlayType` success → `applyNextPlayType(playType)` after the
`gameMsg` write.

### `src/game/gameEventDispatch.js` (modified)

The `'NextPlayTypeSet'` branch, matching the existing guard-clause style. `data` is accepted only as
a non-empty string **or** a non-null object whose `next_type` is a non-empty string; anything else
logs `dispatchEvent: ignoring NextPlayTypeSet — data is not a play type` and returns `false` with
zero store calls (T-08-13). On success it calls `store.applyNextPlayType(data)` — **passing `data`
through unchanged** so normalization has exactly one implementation, in the store.

The module header JSDoc now states that the router covers exactly the 5 `KNOWN_VARIANTS` from
`gameEvents.js` and that the two lists must stay in lockstep. The `default` unknown-tag reject is
untouched; no sixth branch was added.

### Tests

`gameStore.test.js`: `describe('applyNextPlayType (local-apply, no POST)')` (5 tests — bare string,
`{ next_type }` unwrap, null/undefined, non-string/empty/no-`next_type` garbage, idempotency), a new
sibling `setPlayType` case asserting the optimistic write, and a `getNextPlayType === null` assertion
added to the pre-existing `fetchPlayTypes` error-branch test.

`gameEventDispatch.test.js`: `describe('dispatchEvent — NextPlayTypeSet')` (3 routing + 7 table-driven
invalid payloads + 1 no-leak) and `describe('dispatchEvent — variant coverage and defensive branches')`
(a locally-declared 5-entry variant table asserted at length 5, one routing test per variant asserting
`console.error` was **never** called — i.e. no fall-through to `default` — plus the unknown-tag and
6-case malformed-envelope matrices). The obsolete `variants deferred to plans 08-02 / 08-03` loop was
removed entirely, as the 08-02 handoff note anticipated.

### D-13 discharge

`describe('D-13 lineupSubmitted flow (REST path)')` (4 tests) with a `mockFetchGameDataChain` helper
sequencing the three GETs of `fetchGameData(false)` (`fetchGame` → `fetchPlayTypes` → `fetchPlayResult`).

## D-13 call-site audit (recorded verbatim, per plan)

> `fetchGameData` is reachable from exactly two places in `GameLayout.vue`: the initial mount/refresh
> handler and the post-`runPlay` refresh. Neither can fire while a user-submitted lineup is still
> pending, because `runPlay()` already sets `lineupSubmitted = false` before `fetchGameData(false)`
> runs.

Confirmed by `grep -rn "fetchGameData" src/` — only `GameLayout.vue:102` (the `fetchGame(fullSync)`
handler) and `GameLayout.vue:133` (inside `runPlay`, immediately after `await gamesStore.runPlay()`).

**The fallback was NOT taken.** All four D-13 tests passed on their first run against the existing
implementation. `applyLineupSubmitted` was therefore not created, the reset stays inside
`applyPlayResult`, and `dispatchEvent`'s `PlayRun` branch is unchanged. The actual mitigation is the
D-14 zero-op guarantee: the reset is gated on `updateGameStateFromPlayResult` returning true, so a
duplicate, stale, or `new_state`-less delivery never collapses the UI.

## Verification

| Command | Result |
|---------|--------|
| `npm test` | **exit 0** — 12 files, 216 tests passed (was 183) |
| `npx vitest run src/stores/gameStore.test.js` | exit 0 — 51 passed |
| `npx vitest run src/game/gameEventDispatch.test.js` | exit 0 — 63 passed |
| `npx prettier --check` (all 4 files) | **exit 0** |
| `npx eslint` (all 4 files) | **exit 0** |
| `npm run lint` | exit 1 — same 7 pre-existing errors as 08-01/08-02, none in this plan's files |

Acceptance greps, all as specified:

```
grep -c 'nextPlayType.value ='            src/stores/gameStore.js       → 1
grep -c 'playTypes.value = \[\]'          src/stores/gameStore.js       → 1
grep -c 'applyNextPlayType(null)'         src/stores/gameStore.js       → 1
grep -c 'applyNextPlayType(playType)'     src/stores/gameStore.js       → 1
grep -c "case '"                          src/game/gameEventDispatch.js → 5
grep -c '^import '                        src/game/gameEventDispatch.js → 0
grep -c 'axios\|fetch(\|await \|async '   src/game/gameEventDispatch.js → 0
grep -c 'store\.set[A-Z]'                 src/game/gameEventDispatch.js → 0
grep -c 'JSON.stringify'                  src/game/gameEventDispatch.js → 0
```

The branch count of 5 matches the 5 entries of `KNOWN_VARIANTS` in `src/game/gameEvents.js` exactly.
All pre-existing `fetchPlayTypes`, `setPlayType`, `runPlay`, and `fetchPlayResult` cases remain green.

## Deviations from Plan

### `setPlayType` gained an optimistic local write (planned, but a real behavior change)

The plan explicitly directed this and required it be recorded here. Before this plan `setPlayType`
POSTed to `/game/nexttype` and wrote only `gameMsg`; it now also writes `nextPlayType` locally. This
is the correct reading of D-06 ("exactly one write site per field") and is safe because the existing
`setPlayType` tests assert only `gameMsg` / `error`. Practically it means the UI reflects a
user-chosen play type immediately rather than waiting for the next `fetchPlayTypes`; a server that
rejects the type would be re-reconciled on the next refresh.

### D-13 fallback deliberately not taken

Documented above. No `applyLineupSubmitted` action exists, and the 08-01 dispatch tests and
`makeFakeStore()` were left untouched.

### Deferred-variants loop removed rather than narrowed

08-02 had narrowed it to `['NextPlayTypeSet']`. That variant is implemented here, so the block was
deleted outright and replaced by the far more thorough per-variant and completeness describes. This
is the intended terminal handoff.

### Pre-existing lint failure (out of scope, not fixed)

Unchanged from 08-01/08-02: `npm run lint` exits 1 with 7 errors in untouched files
(`vue/multi-word-component-names` ×3, `test/setup.js` `globalThis`/`no-undef` ×4). Scoped
`npx eslint` over this plan's four files exits 0.

No architectural deviations. No auth gates. No Rule 4 escalations. No Rule 1/2/3 auto-fixes needed.

## Known Stubs

None. All 5 EVT-02 variants are implemented and test-covered.

## Carried Risk (D-11 — deliberate, disclosed, unresolved)

The per-variant `data` shapes locked by D-10 remain **UNVERIFIED assumptions** derived from the REST
payload shapes. No Phase 8 test can confirm the real backend WebSocket wire contract; verification is
deferred to Phase 11's `routeWebSocket` E2E (RTT-03). This discharges D-11 by inaction plus
disclosure. The accepted mitigation (D-08) holds: a wrong assumption degrades to "event ignored plus
a loud `console.error`", never to corrupt state — every branch validates before touching the store
and every reject path is asserted to make zero store calls. **This risk must be carried into Phase 11
planning.** The edge-probe report's one `unclassified` EVT-03 row is this, and it remains open by
design.

## Threat Flags

None. All six registered threats for this plan are satisfied and test-asserted:

- **T-08-13** — `data` accepted only as a non-empty string or an object with a non-empty string
  `next_type`; 7 table-driven reject cases assert `false` with zero store calls.
- **T-08-14** — normalization reads only the single named field `next_type` and stores a primitive
  string or `null`; no spread or `Object.assign` of attacker-controlled keys, so no
  prototype-pollution merge surface.
- **T-08-15** — the branch calls `applyNextPlayType` (local-only), never the POSTing `setPlayType`;
  `grep -c 'store\.set[A-Z]'` returns 0.
- **T-08-16** — branch count asserted at exactly 5; the `default` branch rejects any other tag, and
  the unknown-tag test asserts zero store calls.
- **T-08-17** — the log message interpolates neither the payload nor a value; asserted by the
  `.not.toContain('top-secret-value')` case.
- **T-08-18** — accepted (client-side SPA; one `console.error` per event).

## Self-Check: PASSED

- FOUND: `src/stores/gameStore.js`
- FOUND: `src/game/gameEventDispatch.js`
- FOUND: `src/game/gameEventDispatch.test.js`
- FOUND: commit `e73b443` (test, RED — applyNextPlayType)
- FOUND: commit `0f64b70` (feat, GREEN — applyNextPlayType)
- FOUND: commit `9dc8e19` (test, RED — NextPlayTypeSet branch)
- FOUND: commit `38d67f0` (feat, GREEN — NextPlayTypeSet branch)
- FOUND: commit `18dff31` (test — D-13 discharge)

## TDD Gate Compliance

Full RED → GREEN sequence observed twice. Task 1: `e73b443` failed with 6
`store.applyNextPlayType is not a function` errors, then `0f64b70` turned all 47 green. Task 2:
`9dc8e19` failed with 4 routing assertions (the malformed cases correctly already passed via the
`default` branch), then `38d67f0` turned all 63 green. No REFACTOR commit was needed. Task 3 is
non-TDD by design (a regression-discharge task): its tests passed immediately, which **is** the
finding — the fallback was not required.
