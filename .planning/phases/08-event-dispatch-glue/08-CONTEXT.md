# Phase 8: Event Dispatch Glue - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the glue that routes a **validated** WebSocket event envelope to the correct
`gameStore` mutation, for all 5 variants (`GameStarted`, `OffensiveLineupSet`,
`DefensiveLineupSet`, `NextPlayTypeSet`, `PlayRun`) — with every `GameState`-bearing
variant landing through the Phase 7 keystone reducer (`applyGameState`), never via a raw
wholesale replace.

In scope:
- A pure, Vue-free dispatch module in `src/game/` exporting `dispatchEvent(store, event)`
- New **local-apply** store actions on `gameStore` (`apply*`) that the dispatch calls —
  the existing `setLineup`/`setPlayType` actions POST to the server and MUST NOT be used
  by the WS path
- Refactoring the corresponding REST call sites to route through those same `apply*`
  actions (Phase 7-style single-write-path, extended to `lineups` / `nextPlayType` /
  `playResults`)
- Per-variant unit tests against a **fake store object** (zero mocking), folding into
  RTT-01/RTT-02 coverage

**Out of scope (later phases):** the `useGameSocket` composable, `JSON.parse` of
`onmessage`, connect/reconnect/backoff/resync (Phase 9), connection-status store field and
UI indicator (Phase 10), Playwright `routeWebSocket` E2E (Phase 11). Dispatch performs no
I/O and triggers no fetches — it is pure routing plus store calls.

</domain>

<decisions>
## Implementation Decisions

### Dispatch module shape & signature
- **D-01:** Dispatch lives in a **pure module under `src/game/`** (suggested
  `gameEventDispatch.js`; exact filename discretionary), exporting
  `dispatchEvent(store, event)`. The store is **injected as a parameter**, not imported —
  so tests use a plain fake object with recorded calls, preserving the zero-mock
  convention established by `playOutcome.js`, `gameEvents.js`, and `gameStateReducer.js`.
  Explicitly NOT a store action (that would force a real Pinia instance in tests).
- **D-02:** `dispatchEvent` takes an **already-parsed, already-validated** envelope
  `{ event, data }` — the output of `parseEvent`. It does NOT call `parseEvent` itself.
  Phase 9's `onmessage` owns the chain: `JSON.parse` → `parseEvent` → null-check →
  `dispatchEvent`. This mirrors Phase 6 D-03, where `parseEvent` deliberately refused to
  own `JSON.parse`. One module, one job.
- **D-03:** `dispatchEvent` returns a **boolean** — `true` when a store mutation was
  actually performed, `false` when the event was ignored (malformed payload, unknown tag,
  or reducer no-op). Mirrors `updateGameStateFromPlayResult`'s existing `didApply` return
  (Phase 7 D-09b) and gives tests + Phase 9 a cheap assertion.
- **D-04:** If handed a null/malformed envelope or an event tag with no matching branch
  (defensive — shouldn't happen if callers null-check `parseEvent`): `console.error` with
  a leading context phrase, return `false`. **Never throw.** Matches Phase 6 D-06 and
  Phase 7 D-04.

### Store mutation surface
- **D-05:** Add **new local-apply store actions** to `gameStore` using the **`apply*`
  prefix** (matching the reducer's `applyGameState` vocabulary). Dispatch calls only these
  — it never writes store refs directly. All state writes stay inside the store.
- **D-06:** The **existing REST actions are also refactored** to route through the same
  `apply*` actions (Phase 7 keystone treatment extended beyond `gameState`). After this
  phase there should be exactly **one write site per field**: `setLineup`/`getLineup` →
  `applyLineup`; `fetchPlayTypes`/`setPlayType` → `applyNextPlayType`; `fetchPlayResult` →
  `applyPlayResult`. This is an additive refactor — REST UX/optimistic behavior is
  preserved, only the write mechanics change.
- **D-07:** The `apply*` actions **are exported** on the store's public return surface,
  each carrying a JSDoc note marking it **local-apply-only — does not POST**. Rationale:
  in a Pinia setup store the returned object *is* the public API, so an externally-injected
  dispatch module can only reach them if returned. Consistent with
  `updateGameStateFromPlayResult` already being exported for the same reason. The
  desync risk (a component calling `applyLineup` without POSTing) is handled by
  documentation, not by hiding.

### Payload shape assumptions (backend contract UNVERIFIED)
- **D-08:** Posture is **hybrid — defensive but very loud**. Each variant handler extracts
  the field it needs, validates presence/type, and on mismatch emits a `console.error`
  loud enough to be obvious during Phase 9 stubbed-socket tests and Phase 11 E2E, then
  returns `false` **without touching the store**. A wrong backend shape degrades to
  "events ignored", never to corrupt state.
- **D-09:** `PlayRun` → code **strictly to `data.new_state`** (the `PlayAndState` superset
  named in EVT-02/EVT-03, and the same shape the REST play path already consumes). Do NOT
  add a bare-`data`-as-GameState fallback. Anything else is logged loudly + ignored.
- **D-10:** Assumed shapes for the remaining variants — **mirror the existing REST payload
  shapes in `gameStore.js`**:
  - `OffensiveLineupSet` / `DefensiveLineupSet` → `data` **is the lineup object itself**,
    same shape POSTed to `/offense/lineup` / `/defense/lineup` and stored at
    `lineups.offense` / `lineups.defense`.
  - `NextPlayTypeSet` → `data` **is the play-type value** (accept a bare string; also
    tolerate `{ next_type }` per the `/game/nexttype` response shape).
  - `GameStarted` → `data` **is a full `GameState`** carrying `play_counter`.
- **D-11:** These assumptions are **LOCKED for Phase 8**; verification is deferred to
  **Phase 11's `routeWebSocket` E2E**. The Phase 8 researcher should not block on obtaining
  the backend contract. Any drift is caught by the loud logs (D-08) and fixed then.
  ⚠ **Known risk, recorded deliberately** — see `<specifics>`.

### PlayRun handling
- **D-12:** Extract a new **`applyPlayResult(playAndState)`** store action that performs
  exactly what `fetchPlayResult` does today: call `updateGameStateFromPlayResult(...)` and,
  **only when it returns `true`**, push onto `playResults`. Then refactor `fetchPlayResult`
  to call it, so REST and WS share one apply+push path. The reducer stays the single source
  of truth for "is this a new play?" (Phase 7 D-09b preserved), so a play delivered twice
  (once REST, once WS) cannot double-push.
- **D-13:** An applied `PlayRun` **also resets `lineupSubmitted = false`**, collapsing the
  lineup/play-call flow — regardless of which team ran the play. The reset lives **inside**
  `applyPlayResult`.
- **D-14:** That reset fires **only when the reducer actually applied** the incoming state.
  A duplicate or stale `PlayRun` is a true zero-op and must not collapse the UI, preserving
  Phase 7's convergence guarantee end-to-end.

### GameStarted handling
- **D-15:** `GameStarted` carries a full `GameState` and is applied **through
  `applyGameState`** — Phase 7 D-05's bootstrap path means it applies cleanly over the
  store's counterless placeholder `gameState`. It is NOT a signal that triggers a REST
  fetch (that would make dispatch impure and pull Phase 9 transport concerns forward).
- **D-16:** `GameStarted` gets its **own thin store wrapper** (suggested
  `applyIncomingGameState(state)`) — it must NOT be forced through `applyPlayResult` by
  wrapping as `{ new_state: data }`. Doing so would push a synthetic, play-less object onto
  `playResults`, which feeds the `getPlayResult` computed rendered by `PlayResult.vue`, and
  would trip the `lineupSubmitted` reset. Both variants still terminate at the same
  keystone gate (`applyGameState`) via two entry points — success criterion #3 is about the
  reducer, not about a single store action.
- **D-17:** `GameStarted` performs **no collateral resets** — it does not clear
  `playResults`, `lineups`, `nextPlayType`, or `lineupSubmitted`. Mid-session new-game
  lifecycle is a Phase 9 (per-game socket) concern.

### the agent's Discretion
- Exact filenames (`gameEventDispatch.js` vs alternatives) and exact action names
  (`applyLineup` / `applyNextPlayType` / `applyPlayResult` / `applyIncomingGameState`), as
  long as the `apply*` prefix (D-05) is used and they are clearly distinct from the POSTing
  `set*` actions.
- Internal decomposition of `dispatchEvent` (switch vs handler map vs per-variant
  functions) and how the fake store is constructed in tests.
- Exact `console.error` message text, following the Phase 6 D-06 style: leading context
  phrase + relevant identifiers (event tag), **never a full payload dump**.
- Whether `applyLineup` takes `(side, lineup)` or `(isDefense, lineup)` — should read
  naturally against the existing `lineups.value[func]` keying (`'offense'` / `'defense'`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §EVT-02, §EVT-03 — the two requirements this phase satisfies
  (all 5 variants dispatched to the correct store action; `PlayRun` applies the full
  resulting `GameState` from its payload, unwrapping the WS superset shape).
- `.planning/ROADMAP.md` "Phase 8: Event Dispatch Glue" — goal and the 4 success criteria,
  including #3 ("All `GameState`-bearing variants land through the monotonic reducer —
  never a raw wholesale replace") and #4 ("Per-variant tests against a fake store").
- `.planning/STATE.md` "Keystone gate" + "Blockers/Concerns" — notes the unresolved
  per-variant `data` shape question that D-08/D-10/D-11 resolve by assumption.

### Prior-phase contracts this phase consumes (load-bearing)
- `.planning/phases/07-monotonic-reducer-keystone/07-CONTEXT.md` — D-02/D-03 (`applyGameState`
  single export, returns state directly), D-04/D-05 (no-op + bootstrap semantics),
  D-06 (exact-reference zero-op), D-09b (array-push gate derived from reducer verdict).
- `.planning/phases/06-pure-foundations-ws-url-envelope-parsing/06-CONTEXT.md` — D-01/D-02
  (`parseEvent` returns pass-through `{ event, data }` or `null`), D-03 (`parseEvent` does
  not `JSON.parse`), D-06 (`console.error`-on-reject convention).
- `src/game/gameStateReducer.js` — the keystone `applyGameState(current, incoming)` this
  phase must funnel every state-bearing variant through.
- `src/game/gameEvents.js` — `parseEvent` and the canonical `KNOWN_VARIANTS` set; the
  `{ event, data }` output is `dispatchEvent`'s input contract (D-02).

### Refactor targets in the store
- `src/stores/gameStore.js` `fetchGame` — already routes through `applyGameState` (Phase 7
  D-07); the `GameStarted` wrapper (D-16) should be consistent with it.
- `src/stores/gameStore.js` `setLineup` / `getLineup` — currently write
  `lineups.value[func] = ...` inline; refactor through `applyLineup` (D-06).
- `src/stores/gameStore.js` `fetchPlayTypes` / `setPlayType` — currently write
  `nextPlayType.value` / `playTypes.value` inline; refactor through `applyNextPlayType`
  (D-06).
- `src/stores/gameStore.js` `fetchPlayResult` — its apply+push body is what
  `applyPlayResult` extracts (D-12); refactor it to call the new action.
- `src/stores/gameStore.js` `updateGameStateFromPlayResult` — the existing reducer wrapper
  returning `didApply`; reused unchanged by `applyPlayResult`.
- `src/stores/gameStore.js` `runPlay` — already sets `lineupSubmitted = false`; see the
  redundancy note in `<specifics>`.

### Reference implementation / testing pattern (zero-mock pure module)
- `src/game/playOutcome.js` + `src/game/playOutcome.test.js` — gold-standard pure-module
  and zero-mock test style.
- `src/game/gameEvents.test.js`, `src/game/gameStateReducer.test.js` — the closest analogs
  for this phase's per-variant tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `applyGameState` (`src/game/gameStateReducer.js`) — the keystone gate; already handles
  bootstrap (counterless current), duplicate, stale, and malformed-counter cases, and
  returns the exact `current` reference on no-op.
- `updateGameStateFromPlayResult` (`gameStore.js`) — already unwraps `.new_state`, applies
  through the reducer, and returns `didApply`. `applyPlayResult` (D-12) wraps it rather
  than reimplementing it.
- `fetchPlayResult`'s existing 3-line apply+push body — the literal extraction target for
  `applyPlayResult`.
- `parseEvent`'s `KNOWN_VARIANTS` set — the canonical variant list; dispatch's branch
  coverage must match it exactly (5 variants, no more, no less).

### Established Patterns
- Pinia **setup-store form** with an explicit `return { ... }` public surface at the bottom
  of `gameStore.js` — new `apply*` actions must be added there (D-07).
- `console.error` with an interpolated leading context phrase for all rejections; never
  throw at runtime (throwing is reserved for startup config failures, per Phase 6 D-05).
- Pure `src/game/` modules import nothing from the app layer — `dispatchEvent` must not
  import `useGameStore` (hence store injection, D-01).
- Prettier: no semicolons, single quotes, 2-space indent, 100-col.
- Server-shaped payload fields keep `snake_case` (`new_state`, `play_counter`,
  `next_type`) — do not rename.

### Integration Points
- **Upstream (Phase 6):** `parseEvent(raw)` → `{ event, data } | null`. Dispatch is the
  consumer of the non-null case.
- **Downstream (Phase 9):** `useGameSocket`'s `onmessage` chains
  `JSON.parse` → `parseEvent` → null-check → `dispatchEvent(store, envelope)`. The boolean
  return (D-03) is available to Phase 9 for diagnostics but nothing requires it yet.
- **Downstream (Phase 9 resync):** `GET /state` resync will route through the same
  `applyIncomingGameState` wrapper introduced here (D-16) — so name it for general use, not
  `GameStarted`-specifically.
- **Sideways (REST):** the D-06 refactor touches `setLineup`, `getLineup`,
  `fetchPlayTypes`, `setPlayType`, and `fetchPlayResult` — existing store tests for these
  must keep passing.

</code_context>

<specifics>
## Specific Ideas

- ⚠ **Recorded risk (D-11):** the per-variant `data` shapes in D-10 are *assumptions*
  derived from the REST payload shapes, not a verified backend contract. They are locked
  for Phase 8 and verified at Phase 11. The loud-but-defensive posture (D-08) is what makes
  this risk acceptable — a wrong assumption produces ignored events plus a loud log, never
  corrupt state.
- ⚠ **Redundancy to verify (D-13 consequence):** because `fetchPlayResult` will route
  through `applyPlayResult`, the **REST path also gains** a `lineupSubmitted = false` reset.
  `runPlay()` already does this, so it is redundant-but-harmless. The planner must confirm
  this against the existing `gameStore` tests and the `GameLayout.vue` play-flow behavior —
  if it causes a regression, the reset should move to a dispatch-only path.
- The dispatch's rejection posture must be *louder* than `parseEvent`'s, because a payload
  shape mismatch is a silent-data-loss failure mode that only surfaces at Phase 11
  otherwise.
- `applyIncomingGameState` should be named generically (not `applyGameStarted`) because
  Phase 9's `GET /state` resync will reuse it.

</specifics>

<deferred>
## Deferred Ideas

- **Origin filtering / opponent-action notification** — deciding *whether an event came
  from us or the opponent* was not needed for any Phase 8 decision (D-13 resets
  `lineupSubmitted` regardless of origin). Origin-filtered toasts remain deferred as
  **RTP-01** (v1.1 Future Requirements).
- **Clearing collections on a new game** (`playResults` / `lineups` reset) — explicitly
  rejected for Phase 8 (D-17); belongs to Phase 9's per-game socket lifecycle if it turns
  out to be needed.
- **Backend WS contract verification** — deferred to Phase 11 E2E per D-11.

</deferred>

---

*Phase: 8-Event Dispatch Glue*
*Context gathered: 2026-07-30*
