# Phase 7: Monotonic Reducer (KEYSTONE) - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a single shared, `play_counter`-gated apply path — `applyGameState(current, incoming)` —
that both the existing REST play path and the future WS path (Phase 9) funnel through. This is
the hard gate for the v1.1 milestone: **nothing downstream may write `gameState` except through
this reducer**, starting now with the existing REST call sites.

In scope:
- A pure `applyGameState(current, incoming)` reducer in `src/game/`
- Refactoring existing REST call sites (`fetchGame`, `fetchPlayResult`, `fetchAllPlayResults` via
  `updateGameStateFromPlayResult`) to route through it — additive refactor, not a rewrite
- Unit tests covering the reducer's ordering/idempotency behavior
- Folding in Phase 6's pure `toWebSocketUrl`/`gameEvents.parseEvent` test coverage to satisfy
  RTT-01's "pure + reducer coverage" requirement

**Out of scope (later phases):** dispatching parsed WS events to store actions (Phase 8), the
`useGameSocket` composable, reconnect/backoff/resync (Phase 9), connection-status UI (Phase 10),
E2E (Phase 11). REST optimistic-apply behavior itself is preserved — this phase changes *how*
`gameState` gets written, not the play flow's UX.

</domain>

<decisions>
## Implementation Decisions

### Reducer location & API shape
- **D-01:** `applyGameState` is a **pure module** at `src/game/monotonicReducer.js` (naming/exact
  filename discretionary but should read clearly), mirroring the Phase 6 zero-mock convention
  (`playOutcome.js`, `gameEvents.js`) — pure functions, JSDoc, no Vue/store access, colocated
  `*.test.js` with zero mocking.
- **D-02:** Single export: `applyGameState(current, incoming)`. **No** separate
  `applyPlayResult` wrapper — callers holding a play-result-shaped payload (`{ new_state: {...} }`)
  extract `.new_state` themselves before calling `applyGameState`. One function, one job.
- **D-03:** Return contract: `applyGameState` returns the **state directly** (not a
  `{applied, state}` tuple). Returns the `incoming` object (new reference) when applied, or the
  exact same `current` reference (unchanged) when rejected as a no-op. Store usage:
  `gameState.value = applyGameState(gameState.value, incoming)`.

### No-op / convergence semantics
- **D-04:** Incoming state with a **missing/undefined/NaN `play_counter`** is rejected as a no-op
  (return `current` unchanged) — treated the same as a stale/older state. Log via
  `console.error` with a context phrase (matches Phase 6 D-06 convention), do NOT throw (this is a
  runtime data issue on an ongoing connection, not a startup config failure like Phase 6's
  `toWebSocketUrl` invalid-input case).
- **D-05:** If the **current** state has no `play_counter` (the store's initial placeholder
  `gameState` object has no `play_counter` field at all), treat current as always-older —
  the first real incoming state with a valid `play_counter` always applies. This is the bootstrap
  path; no special-case flag needed from callers.
- **D-06:** When `incoming.play_counter === current.play_counter` (same play delivered twice,
  e.g. once via REST and once via WS), this is a **zero-op**: return the exact same `current`
  reference — do NOT construct a new object via spread. This is what guarantees "no
  new-reference/no re-render/flicker" per the phase's success criteria. Only apply
  (`incoming.play_counter > current.play_counter`) creates a new reference.

### REST call-site migration scope
- **D-07:** `fetchGame()` (the initial `/game/state` snapshot fetch) **is** refactored to route
  through `applyGameState` too, even though it currently has zero counter checking. This satisfies
  the hard gate literally — "nothing downstream may write gameState except through this reducer."
  Per D-05, this becomes the bootstrap apply (current has no counter → always applies).
- **D-08:** `updateGameStateFromPlayResult(playResult)` (existing function in `gameStore.js`,
  currently unconditional spread) is **kept as a thin wrapper** — its internals change to call
  `applyGameState(gameState.value, playResult.new_state)` and assign the result, but its name and
  public signature stay the same. No call-site churn at `fetchPlayResult`/`fetchAllPlayResults`;
  only `updateGameStateFromPlayResult`'s body changes.

### playResults array vs gameState gating
- **D-09 (SUPERSEDED — see D-09b):** `fetchPlayResult()`'s existing separate gate (comparing
  `newPlay.new_state.play_counter` against the most recent entry in the `playResults` array before
  pushing) was originally **kept independent** from the new `applyGameState` gate — chosen for low
  risk, to preserve existing tested behavior exactly. This decision was reversed post-execution (see
  D-09b below).
- **D-09b (post-execution reversal, supersedes D-09):** The independent array-push comparison in
  `fetchPlayResult()` was removed and the array-push gate is now **derived from the reducer's
  verdict**. `updateGameStateFromPlayResult` returns whether `applyGameState` actually applied the
  incoming state (reference comparison: `applied !== gameState.value`), and `fetchPlayResult` pushes
  onto `playResults` only when that returns `true`. Rationale: eliminate the duplicated `play_counter`
  math so "is this a new play?" has a single source of truth (the reducer). Semantic shift: the
  array gate now compares incoming vs `gameState.value.play_counter` (the reducer baseline) rather
  than vs the last `playResults` entry — normally lockstep, but they can diverge after
  `fetchAllPlayResults` replaces the array wholesale; the array now tracks `gameState` advancement.
  Covered by 4 new `fetchPlayResult` tests (apply+push, duplicate reject, stale reject, missing
  `new_state`). Commit `b240ff5`.

### the agent's Discretion
- Exact filename for the reducer module (`monotonicReducer.js` vs alternatives) and internal
  helper decomposition (e.g. a private `isNewer(current, incoming)` guard) are the planner/
  executor's call.
- Exact JSDoc wording and the precise `console.error` message text for rejected applies (mirror
  Phase 6 D-06's style: leading context phrase + relevant identifiers, no full payload dump).
- Whether `applyGameState` does a shallow copy (`{ ...incoming }`) or returns `incoming` by
  identity when applying is discretionary, as long as a *new* reference is produced relative to
  the rejected current-reference case (D-06 requires current === current on no-op; D-03/D-06 do
  not require `incoming !== incoming` on apply).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §STA-01, §STA-02, §RTT-01 — the three requirements this phase
  satisfies (shared monotonic reducer; idempotent/convergent no-op; unit test coverage of the
  reducer plus Phase 6's pure modules).
- `.planning/ROADMAP.md` "Phase 7: Monotonic Reducer (KEYSTONE)" — goal, success criteria, and the
  explicit hard-gate note: "nothing downstream may write `gameState` except through this reducer.
  REST optimistic behavior is preserved (additive refactor, not a rewrite)."
- `.planning/STATE.md` "Keystone gate" note — Phase 7 must land before any WS code (Phase 8+)
  writes `gameState`.

### Reference implementation pattern (zero-mock pure module, from Phase 6)
- `src/game/playOutcome.js` — gold-standard pure-module style (JSDoc on exports, defensive
  defaults, no throwing, no Vue/store access) — the reducer should match this structurally.
- `src/game/playOutcome.test.js` — zero-mock unit-test style to mirror for the reducer's tests.
- `.planning/phases/06-pure-foundations-ws-url-envelope-parsing/06-CONTEXT.md` — prior phase's
  decisions (D-01..D-06), including the `console.error`-on-reject convention (D-06) this phase
  follows.

### Existing gameState write sites (to be refactored)
- `src/stores/gameStore.js:54-59` (`fetchGame`) — currently `gameState.value = response.data`
  unconditionally; becomes the bootstrap-apply call site (D-07).
- `src/stores/gameStore.js:268-289` (`fetchPlayResult`) — originally had its own `play_counter`
  array-push gate; per D-09b that gate was removed and the push is now derived from
  `updateGameStateFromPlayResult`'s reducer-applied return value.
- `src/stores/gameStore.js:291-302` (`fetchAllPlayResults`) — also calls
  `updateGameStateFromPlayResult` on the most recent play.
- `src/stores/gameStore.js:350-357` (`updateGameStateFromPlayResult`) — the refactor target
  (D-08): internals change to call `applyGameState`, signature/name unchanged.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/game/playOutcome.js` + colocated `.test.js`: direct structural template for the new
  reducer module — pure function, JSDoc, defensive style, zero-mock Vitest tests.

### Established Patterns
- No-semicolons, single-quote, 2-space, 100-col Prettier config; `console.error` with an
  interpolated context phrase for logs (rejection logging in the reducer follows this).
- `@` → `src` alias exists but pure `src/game/` modules import nothing from the app layer.

### Integration Points
- The reducer becomes the single write path for `gameState.value` in `gameStore.js`, called from
  `fetchGame`, and (via the `updateGameStateFromPlayResult` wrapper) from `fetchPlayResult` and
  `fetchAllPlayResults`.
- Phase 8's `dispatchEvent` and Phase 9's `useGameSocket` resync will call the same
  `applyGameState` export — this phase's public API is a load-bearing contract for both.

</code_context>

<specifics>
## Specific Ideas

- The zero-op must literally return the same object reference on equal/older `play_counter` —
  this is what Vue's reactivity system needs to see "no change" and skip re-render (success
  criterion #2 verified structurally, not just behaviorally).
- The bootstrap case (current state has no `play_counter` yet) always yields to the first real
  incoming state — this covers both `fetchGame()`'s initial snapshot and, later, `useGameSocket`'s
  first resync.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Dispatching WS events (Phase 8), the socket
composable/reconnect/resync (Phase 9), and connection-status UI (Phase 10) were explicitly kept
out and are unaffected by this phase's decisions beyond consuming its `applyGameState` export.

</deferred>

---

*Phase: 7-Monotonic Reducer (KEYSTONE)*
*Context gathered: 2026-07-23*
