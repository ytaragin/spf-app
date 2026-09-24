---
phase: 08-event-dispatch-glue
verified: 2026-08-28T18:10:00Z
status: human_needed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "dispatchEvent has no production caller — no socket routes events to it yet"
    addressed_in: "Phase 9"
    evidence: "Phase 9 SC1/SC3: 'useGameSocket() opens a read-only socket to /game/ws ... resyncs via GET /state routed through the monotonic reducer'"
  - truth: "D-11 — per-variant WS payload shapes are unverified assumptions derived from REST shapes"
    addressed_in: "Phase 11"
    evidence: "08-03-SUMMARY Carried Risk: verification deferred to Phase 11 routeWebSocket E2E (RTT-03)"
human_verification:
  - test: "In the running app, pick a play type in PlayTypeSelector against a real backend, then observe PlayLineup's box layout and the 'Current Play Type' chip before any refresh."
    expected: "Chip and box layout update immediately after the POST succeeds, and still match server state after the next fetchGameData refresh."
    why_human: "08-03 changed setPlayType to write nextPlayType optimistically (gameStore.js:392). Unit tests assert the store value; only a real session shows whether the earlier UI update conflicts with the layout PlayLineup derives from nextPlayType."
---

# Phase 8: Event Dispatch Glue Verification Report

**Phase Goal:** Wire parsed events to the correct store mutations for all 5 variants, so incoming events reach the keystone reducer
**Status:** human_needed (all automated must-haves verified; 1 UI behavior change to confirm)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `dispatchEvent` routes all 5 variants to the correct store action | ✓ VERIFIED | `src/game/gameEventDispatch.js` — `case 'PlayRun'` →`applyPlayResult` (L62), `'GameStarted'` →`applyIncomingGameState` (L80), `'OffensiveLineupSet'`/`'DefensiveLineupSet'` →`applyLineup('offense'|'defense', …)` (L92/L105), `'NextPlayTypeSet'` →`applyNextPlayType` (L118). Exactly 5 `case` labels; set matches `KNOWN_VARIANTS` in `gameEvents.js:11-17` element-for-element. |
| 2 | `PlayRun` applies the full `GameState` at `data.new_state` | ✓ VERIFIED | Branch validates `data.new_state` is a non-null object, then forwards the **whole** `PlayAndState` (`store.applyPlayResult(data)`), which unwraps `new_state` in `gameStore.js:419`. No bare-`data` fallback (D-09). |
| 3 | All `GameState`-bearing variants land through the monotonic reducer | ✓ VERIFIED | `grep 'gameState.value ='` in `src/stores/gameStore.js` yields exactly 2 sites — L75 (`applyIncomingGameState`, preceded by `applyGameState` at L74) and L421 (`updateGameStateFromPlayResult`, preceded by `applyGameState` at L419). **No bypass write site exists.** `dispatchEvent` contains zero `store.set*` calls and zero imports. |
| 4 | Per-variant tests against a fake store verify extraction and dispatch | ✓ VERIFIED | `src/game/gameEventDispatch.test.js` — 63 tests, `makeFakeStore` plain-object recorders, per-variant describes plus a locally-declared 5-entry variant table asserted at length 5. `src/stores/gameStore.test.js` — 51 tests incl. all four `apply*` actions. |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| EVT-02 | All 5 variants dispatched to correct store action | ✓ SATISFIED | Truth 1 |
| EVT-03 | `PlayRun` applies full carried `GameState`, unwrapping the WS superset | ✓ SATISFIED | Truth 2 |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `gameEventDispatch.js` | `gameStore.applyPlayResult` | injected store, `case 'PlayRun'` | WIRED |
| `gameStore.applyPlayResult` | `gameStateReducer.applyGameState` | `updateGameStateFromPlayResult` L419 | WIRED |
| `gameStore.applyIncomingGameState` | `applyGameState` | L74 | WIRED |
| `dispatchEvent` | any production caller (socket) | — | **NOT WIRED — deferred to Phase 9** (see Deferred Items) |

### Test Run

`npm test` → **exit 0 — 12 files, 216 tests passed** (matches 08-03-SUMMARY's claim). The `applyGameState: rejected incoming state` lines on stderr are intentional reducer-rejection logs from the D-13/D-14 zero-op tests, not failures.

### Scrutiny Items

1. **All 5 variants route to store mutations** — confirmed in source, not just summary. ✓
2. **No bypass write sites** — confirmed: 2 `gameState.value =` assignments, both immediately downstream of `applyGameState`. Lineups (`lineups.value[side] =`, 1 site, L89) and `nextPlayType` (`nextPlayType.value =`, 1 site, L191) are not `GameState` and correctly need no reducer gate. ✓
3a. **08-02 narrowed 08-01's deferred-variants loop** — legitimate and non-weakening. The three tags removed became *valid* (`{}` is a payload object) once implemented; they are replaced by 22 per-variant tests. 08-03 then deleted the loop entirely and substituted a stronger completeness assertion. No coverage was lost. ✓
3b. **`setPlayType` optimistic write** (`gameStore.js:392`) — a real, additive behavior change. Mitigating facts: the write occurs **only after the POST resolves** (inside `try`, after the `gameMsg` assignment), so it never persists a server-rejected value; it goes through the same normalizer as every other path; the value is re-reconciled by the next `fetchGameData` → `fetchPlayTypes`. Consumers (`PlayTypeSelector.vue:36`, `PlayLineup.vue:76-102`) only read it, and all pre-existing `setPlayType` tests remain green plus a new assertion at `gameStore.test.js:93`. **Assessment: does not break existing gameplay; routed to human verification for UI confirmation only.**
4. **D-11 carried blocker** — properly recorded in `08-03-SUMMARY.md` under "Carried Risk (D-11 — deliberate, disclosed, unresolved)" with an explicit "must be carried into Phase 11 planning" instruction. **Judgment: legitimately deferred, not phase-blocking.** No Phase 8 artifact can observe the real WS wire contract, and the failure mode is fail-closed by construction — every branch validates before touching the store and every reject path is asserted to make zero store calls, so a wrong shape degrades to "ignored + `console.error`", never to corrupted state.

### Anti-Patterns Found

None in phase files. Zero `TODO`/`FIXME`/`XXX`/`TBD`/`HACK` markers in `gameEventDispatch.js` or `gameStore.js`. `npm run lint` still reports 7 errors, all pre-existing in files this phase never touched (3× `vue/multi-word-component-names`, 4× `globalThis` in `test/setup.js`) — a pre-existing repo-hygiene item, not a Phase 8 gap.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|---|---|---|
| 1 | `dispatchEvent` has no production caller | Phase 9 | Phase 9 SC1 — `useGameSocket()` owns transport and routing |
| 2 | D-11 unverified per-variant WS payload shapes | Phase 11 | RTT-03 `routeWebSocket` E2E |

## Verdict

**Phase goal ACHIEVED.** All 4 ROADMAP success criteria and both requirements (EVT-02, EVT-03) are verified in source, not merely in summaries. All 5 variants route to distinct local-apply store actions, every `GameState`-bearing path is gated by the Phase 7 monotonic reducer with no bypass, and the 216-test suite passes. Neither self-reported deviation compromises the goal; D-11 is a correctly-disclosed, fail-closed deferral to Phase 11. One UI behavior change (`setPlayType` optimistic write) is flagged for human confirmation before ship.

---

_Verified: 2026-08-28T18:10:00Z_
_Verifier: gsd-verifier_
