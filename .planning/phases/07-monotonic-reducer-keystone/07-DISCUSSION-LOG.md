# Phase 7: Monotonic Reducer (KEYSTONE) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 7-Monotonic Reducer (KEYSTONE)
**Areas discussed:** Reducer location & API shape, No-op/convergence semantics, REST call-site migration scope, playResults array vs gameState gating

---

## Reducer location & API shape

| Option | Description | Selected |
|--------|-------------|----------|
| Pure module in src/game/monotonicReducer.js | Mirrors Phase 6's zero-mock convention; store calls it and assigns result | ✓ |
| Store-internal function | Keep gating inline in gameStore.js, similar to existing updateGameStateFromPlayResult | |
| You decide | Let planner/executor pick | |

**User's choice:** Pure module in `src/game/monotonicReducer.js`.

**Follow-up:** Return contract — "Returns state directly" (current on reject, incoming on apply) chosen over a `{applied, state}` tuple.

**Follow-up:** Naming — single `applyGameState` function chosen over `applyGameState` + `applyPlayResult` wrapper pair (ROADMAP mentions both names, but user chose to keep it to one function; callers extract `.new_state` themselves).

---

## No-op/convergence semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Reject missing play_counter as no-op | Missing/undefined/NaN incoming counter treated as stale, logged via console.error | ✓ |
| Missing counter = always apply | Bootstrap escape hatch for endpoints lacking play_counter | |

**User's choice:** Reject missing/undefined incoming `play_counter` as a no-op.

**Follow-up:** For the reverse case (current state has no `play_counter`, e.g. store's initial placeholder), user chose "Undefined current counter = always older" — the first real incoming state always wins (bootstrap path), over a symmetric-comparison approach that could block first apply.

**Follow-up:** For exactly-equal `play_counter` (same play delivered via both REST and WS), user chose "Equal counter = same reference, zero-op" — strict reference equality required to guarantee no re-render — over creating a new object anyway via spread.

---

## REST call-site migration scope

| Option | Description | Selected |
|--------|-------------|----------|
| fetchGame() also routes through reducer | Initial snapshot fetch refactored to use applyGameState too, per the hard gate | ✓ |
| fetchGame() stays unconditional | Exempted as a one-time initial load | |

**User's choice:** `fetchGame()` is refactored to route through the reducer (becomes the bootstrap-apply call site).

**Follow-up:** For `updateGameStateFromPlayResult`, user chose "Keep updateGameStateFromPlayResult, refactor internals (Recommended)" over removing the wrapper and calling the reducer directly at every site — keeps call-site churn minimal.

---

## playResults array vs gameState gating

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both gates, don't consolidate | Array-push gate (history) and state-apply gate (gameState) stay independent | ✓ |
| Derive array-push gate from reducer's applied signal | Consolidate the two gates | |

**User's choice:** Keep both gates independent — low risk, preserves existing tested behavior in `fetchPlayResult()`.

---

## the agent's Discretion

- Exact filename for the reducer module (beyond `monotonicReducer.js` suggestion) and internal helper decomposition.
- Exact JSDoc wording and `console.error` message text for rejected applies.
- Whether `applyGameState` does a shallow copy or returns `incoming` by identity when applying (only the no-op-reference guarantee is locked).

## Deferred Ideas

None — discussion stayed fully within Phase 7's scope (the monotonic reducer and its REST call-site integration). Phase 8 (event dispatch), Phase 9 (socket composable/reconnect/resync), and Phase 10 (connection status UI) were referenced only as future consumers of `applyGameState`, not as new scope.
