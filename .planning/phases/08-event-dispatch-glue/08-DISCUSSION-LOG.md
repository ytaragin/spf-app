# Phase 8: Event Dispatch Glue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 8-event-dispatch-glue
**Areas discussed:** Store mutation surface, Dispatch module shape & signature, Unknown payload shapes, PlayRun side effects, GameStarted semantics

---

## Store mutation surface

**Q1: WS events can't call setLineup()/setPlayType() (those POST). How should non-GameState variants write to the store?**

| Option | Description | Selected |
|--------|-------------|----------|
| New local-apply store actions | `applyLineup`/`applyNextPlayType` etc.; dispatch calls only these; all writes stay in the store | ✓ |
| Dispatch writes store refs directly | Fewer exports, but spreads write logic outside the store | |
| Split existing REST actions into post + apply | Phase 7 treatment extended to lineups/playType | |

**Q2: Refactor existing REST actions through the new apply* actions, or additive only?**

| Option | Description | Selected |
|--------|-------------|----------|
| Additive only — leave REST untouched | Lower risk; two write paths per field | |
| Also refactor REST paths through apply* | Exactly one write site per field, Phase 7 keystone treatment extended | ✓ |

**Q3: Naming convention?**

| Option | Description | Selected |
|--------|-------------|----------|
| `apply*` prefix | Matches `applyGameState` vocabulary from Phase 7 | ✓ |
| `set*Local` suffix | Explicitly signals "no network" next to the POSTing set* actions | |
| You decide | Planner picks | |

**Q4: Export apply* on the store's public surface, or keep internal?**

**User's choice:** Asked "What is the best practice?" → after explanation, selected *Export them with a local-apply-only JSDoc note*.
**Notes:** Explained that in a Pinia setup store the returned object *is* the public API, so an externally-injected dispatch module can only reach them if returned — "keep internal" wasn't actually available given the chosen architecture. The only genuine alternative (making `dispatchEvent` itself a store action) would cost the zero-mock testing style. Documentation over hiding for the desync risk.

---

## Dispatch module shape & signature

**Q1: Where does dispatch live and how does it reach the store?**

| Option | Description | Selected |
|--------|-------------|----------|
| Pure module in `src/game/`, store injected | Fake-store tests, zero mocking; matches success criterion #4 | ✓ |
| Store action on gameStore | Closure access, but tests need real Pinia | |
| Extend `src/game/gameEvents.js` | Whole envelope→action path in one module | |

**Q2: Does it call parseEvent itself, or take an already-parsed envelope?**

| Option | Description | Selected |
|--------|-------------|----------|
| Already-parsed envelope | One module one job; mirrors Phase 6 D-03 | ✓ |
| Calls parseEvent internally | Simpler Phase 9 onmessage, two responsibilities | |

**Q3: Return value?**

| Option | Description | Selected |
|--------|-------------|----------|
| Boolean "applied" | Mirrors `updateGameStateFromPlayResult`'s didApply | ✓ |
| Void | Assert on fake-store recorded calls instead | |
| Result object `{event, applied, reason}` | Richer, no current consumer | |

**Q4: Malformed envelope / unknown tag handling?**

| Option | Description | Selected |
|--------|-------------|----------|
| `console.error` + return false | Never-throw posture, matches Phase 6 D-06 / Phase 7 D-04 | ✓ |
| Silently return false | Avoids duplicate log noise | |
| Throw | Fail loud like `toWebSocketUrl` | |

---

## Unknown payload shapes

**Q1: How defensive should handlers be, given the unverified backend contract?**

| Option | Description | Selected |
|--------|-------------|----------|
| Defensive, ignore-on-mismatch | Degrades to "events ignored" | |
| Assume documented shape, fail loud | Fast contract-drift discovery, risks corrupt state | |
| Hybrid — defensive but very loud | Ignore + log loudly enough to surface at Phase 9/11 | ✓ |

**Q2: PlayRun — strict `data.new_state` or accept a bare GameState fallback?**

| Option | Description | Selected |
|--------|-------------|----------|
| Accept both | Survives either backend shape, fuzzier contract | |
| Strict `data.new_state` only | Clean single contract; drift surfaces via loud log | ✓ |

**Q3: How to resolve the remaining unconfirmed shapes?**

| Option | Description | Selected |
|--------|-------------|----------|
| Flag for the Phase 8 researcher to confirm | Researcher verifies against backend before planning | |
| Lock the assumption, verify at Phase 11 | Caught by routeWebSocket E2E and fixed then | ✓ |
| I have the backend contract | Point researcher at a spec file | |

**Q4: Confirm the specific assumed shapes?**

**User's choice:** Yes — mirror the REST payload shapes (lineup variants = the lineup object; NextPlayTypeSet = the play-type value; GameStarted = full GameState with play_counter).

---

## PlayRun side effects

**Q1: How is PlayRun handled beyond the reducer apply?**

| Option | Description | Selected |
|--------|-------------|----------|
| Call `store.updateGameStateFromPlayResult(data)` | Reuses existing wrapper, one path for REST and WS | ✓ |
| New applyPlayResult calling applyGameState directly | More explicit, duplicates working logic | |
| Apply state only, skip playResults | playResults stays REST-only | |

**Q2 (follow-up): the push lives in `fetchPlayResult`, not the wrapper — how do we keep it inside the store?**

| Option | Description | Selected |
|--------|-------------|----------|
| Extract an `applyPlayResult(playAndState)` store action | Wraps updateGameStateFromPlayResult + gated push; refactor fetchPlayResult to use it | ✓ |
| Dispatch does the push itself | Fewest changes, contradicts the area-1 decision | |
| Don't push from WS at all | playResults stays REST-owned | |

**Notes:** Surfaced that dispatch calling the wrapper directly would put array-mutation logic back outside the store, contradicting D-05.

**Q3: Should an applied PlayRun reset `lineupSubmitted`?**

| Option | Description | Selected |
|--------|-------------|----------|
| No — leave it alone | Opponent's play shouldn't collapse your in-progress lineup UI | |
| Yes — reset on any applied PlayRun | New play means previous play is over, regardless of origin | ✓ |
| Only if it was our play | Needs origin/possession logic not in scope | |

**Q4: Reset on every event, or only when the reducer applied?**

| Option | Description | Selected |
|--------|-------------|----------|
| Only when the reducer applied | Duplicate/stale PlayRun stays a true zero-op | ✓ |
| On every PlayRun event | Simpler, breaks convergence guarantee | |

**Notes:** Flagged the consequence that refactoring `fetchPlayResult` through `applyPlayResult` gives the REST path a redundant (but harmless) `lineupSubmitted` reset, since `runPlay()` already does it — recorded in CONTEXT.md for the planner to verify against existing tests.

---

## GameStarted semantics

**Q1: What is GameStarted's payload and what should it do?**

| Option | Description | Selected |
|--------|-------------|----------|
| Full GameState — apply through the reducer | Phase 7 D-05 bootstrap path handles it cleanly | ✓ |
| Signal only — trigger a REST resync | Makes dispatch impure, pulls Phase 9 concerns forward | |
| Apply if it looks like a GameState, else ignore loudly | | |

**Q2: Reset collateral state (playResults, lineups, nextPlayType, lineupSubmitted)?**

| Option | Description | Selected |
|--------|-------------|----------|
| No — state only | Mid-session new-game lifecycle is a Phase 9 concern | ✓ |
| Yes — clear playResults and lineups | Old data meaningless for a new game | |
| Clear playResults only | | |

**Q3: Thin wrapper for a bare GameState, or force through applyPlayResult?**

**Initial choice:** *Force both through applyPlayResult* (wrapping as `{ new_state: data }`).
**Correction raised:** flagged that `applyPlayResult` now also pushes onto `playResults` and resets `lineupSubmitted` — wrapping GameStarted would push a synthetic, play-less entry into `playResults`, which feeds `getPlayResult` rendered by `PlayResult.vue`.

**Q4 (re-decision):**

| Option | Description | Selected |
|--------|-------------|----------|
| Separate thin wrapper for GameStarted | Both end at applyGameState; GameStarted skips play-specific side effects | ✓ |
| Single internal helper, two public actions | Literally one reducer entry point, side effects layered on top | |
| Still force it through applyPlayResult | Accept synthetic entry, filter downstream | |

---

## the agent's Discretion

- Exact filenames (`gameEventDispatch.js` vs alternatives) and exact action names, provided the `apply*` prefix is used and they're distinct from the POSTing `set*` actions
- Internal decomposition of `dispatchEvent` (switch vs handler map vs per-variant functions) and fake-store construction in tests
- Exact `console.error` message text (Phase 6 D-06 style — context phrase + event tag, no payload dump)
- Whether `applyLineup` takes `(side, lineup)` or `(isDefense, lineup)`

## Deferred Ideas

- Origin filtering / opponent-action notifications — not needed for any Phase 8 decision; remains deferred as RTP-01
- Clearing collections on a new game — explicitly rejected for Phase 8 (D-17); revisit in Phase 9 lifecycle if needed
- Backend WS contract verification — deferred to Phase 11 E2E (D-11)
