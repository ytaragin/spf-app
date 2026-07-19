# Phase 6: Pure Foundations — WS URL + Envelope Parsing - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver two pure, Vue-free modules in `src/game/`, mirroring the zero-mock
`playOutcome.js` style, that establish the realtime wire contract:

1. **`toWebSocketUrl(baseUrl)`** — derives the WS URL from the REST base URL
   (`http:`→`ws:`, `https:`→`wss:`), preserves host+port, and sets the path to
   `/game/ws`. No new env var (reuses `VITE_API_BASE_URL`).
2. **`gameEvents.parseEvent(raw)`** — unwraps the tagged `{ event, data }`
   envelope for the 5 known event variants and rejects malformed/unknown
   envelopes without throwing.

Both modules covered by unit tests with **zero mocking** (pure logic),
consistent with `src/game/playOutcome.js` + colocated `*.test.js`.

**Out of scope (later phases):** the monotonic reducer / state application
(Phase 7), dispatching parsed events to store actions (Phase 8), the
`useGameSocket` composable incl. `JSON.parse` of `onmessage` data,
reconnect/backoff/resync (Phase 9), connection-status UI (Phase 10), and E2E
(Phase 11).

</domain>

<decisions>
## Implementation Decisions

### parseEvent return contract
- **D-01:** Valid parse returns the envelope **pass-through unchanged**:
  `{ event, data }`, where `data` remains the raw variant payload. No renaming
  to `{ type, payload }` — keep wire naming.
- **D-02:** Rejected (malformed or unknown-variant) envelope returns **`null`**.
  Downstream callers use the defensive-null pattern
  (`const parsed = parseEvent(raw); if (!parsed) return`), matching
  `playOutcome.js`'s optional-chaining / null-default style.

### parseEvent input type
- **D-03:** `parseEvent` accepts an **already-parsed object only**. It does NOT
  `JSON.parse`. The `useGameSocket` composable (Phase 9) owns `JSON.parse` of
  `event.data` and its syntax-error handling before calling `parseEvent`.
  `parseEvent` is purely about envelope shape + variant validation.

### toWebSocketUrl edge cases
- **D-04:** Use the **`URL` constructor**: swap protocol (`http:`→`ws:`,
  `https:`→`wss:`), **preserve host + port**, and set `pathname` to `/game/ws`
  (replacing any existing path; trailing-slash handling falls out of the URL
  constructor naturally).
- **D-05:** On invalid/empty/unset base URL, **throw** (fail loud). A broken base
  URL means the whole app is non-functional, so surface it at startup rather
  than silently returning null.

### Rejection logging
- **D-06:** On rejection, log via **`console.error`** to match the repo's
  existing convention (all store logs use `console.error`). Use a leading
  context phrase + the offending envelope's `event` tag (or short snippet), in
  the style ``console.error(`Ignoring unknown/malformed WS event: ${...}`)``.
  Do NOT dump the full raw payload.

### the agent's Discretion
- Exact JSDoc wording, internal helper decomposition, and the precise set of
  malformed-shape guards (missing `event`, non-string `event`, missing `data`,
  null/non-object input) are the planner/executor's call — as long as none
  throw and all reject-to-`null` + `console.error`.
- The canonical list of the 5 known `event` values to accept:
  `GameStarted`, `OffensiveLineupSet`, `DefensiveLineupSet`, `NextPlayTypeSet`,
  `PlayRun` (from REQUIREMENTS EVT-02 / ROADMAP). Representation (Set vs array
  vs switch) is discretionary.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §WS-01, §EVT-01 — the two requirements this phase
  satisfies (pure `toWebSocketUrl`; pure Vue-free `gameEvents.js` parse +
  reject-without-throwing).
- `.planning/ROADMAP.md` "Phase 6" — goal, success criteria, and the
  build-order gate (pure foundations precede the Phase 7 keystone reducer).

### Reference implementation pattern (zero-mock pure module)
- `src/game/playOutcome.js` — gold-standard pure-module style (JSDoc on
  exports, defensive optional chaining, no throwing, no Vue/store access).
- `src/game/playOutcome.test.js` — zero-mock unit-test style to mirror.
- `src/game/SPFMetadata.js` / `.test.js`, `src/game/TeamData.js` / `.test.js`
  — additional pattern references for module + colocated tests.

### Existing WS/URL/state touchpoints
- `src/stores/gameStore.js:51` — current `VITE_API_BASE_URL` read
  (`import.meta.env.VITE_API_BASE_URL`); `toWebSocketUrl` derives from this
  same value (no new env var).
- `src/stores/gameStore.js:273–297,352` — existing `play_counter` /
  `new_state` handling (informs Phase 7, not built here, but clarifies the
  `PlayRun` payload shape that `parseEvent` passes through untouched).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/game/playOutcome.js`: direct structural template for both new modules —
  pure functions, JSDoc, defensive defaults, no throwing (except the explicit
  `toWebSocketUrl` invalid-input throw, D-05).
- Existing colocated `*.test.js` files in `src/game/`: the zero-mock Vitest
  convention (no jsdom/Vuetify/Pinia needed for these pure modules).

### Established Patterns
- No-semicolons, single-quote, 2-space, 100-col Prettier config; `console.error`
  with interpolated context phrase for logs (D-06 follows this).
- `@`→`src` alias exists but pure `src/game/` modules have no imports here.

### Integration Points
- `toWebSocketUrl` will be consumed by `useGameSocket` (Phase 9); reads the same
  `VITE_API_BASE_URL` as the stores.
- `parseEvent`'s `{ event, data }` output is the input contract for the Phase 8
  dispatch glue; its `null` rejection is the "ignore" signal for Phase 9's
  `onmessage` handler.

</code_context>

<specifics>
## Specific Ideas

- `parseEvent` return shape is a strict pass-through `{ event, data }` on
  success — do not normalize/rename fields at this layer.
- `toWebSocketUrl` should lean on the platform `URL` constructor rather than
  hand-rolled string manipulation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (`JSON.parse` of socket messages,
reconnect/backoff, state application, and event dispatch were explicitly kept
out and assigned to Phases 7–9.)

</deferred>

---

*Phase: 6-Pure Foundations — WS URL + Envelope Parsing*
*Context gathered: 2026-07-19*
