---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Realtime
current_phase: 07
status: executing
stopped_at: Phase 8 context gathered
last_updated: "2026-07-30T18:27:10.657Z"
last_activity: 2026-07-23
last_activity_desc: Phase 07 Plan 02 (gameStore REST refactor) complete
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
  percent: 33
current_phase_name: monotonic-reducer-keystone
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-18)

**Core value:** The UI reflects server-side game events — especially the opponent's actions — in real time over a read-only WebSocket, while all client operations continue over REST and the backend-authoritative model is preserved.
**Current focus:** Phase 07 — monotonic-reducer-keystone

## Current Position

Phase: 07 — monotonic-reducer-keystone (complete)
Plan: 2 of 2 complete (07-01 and 07-02 both done)
Status: Ready to plan next phase
Last activity: 2026-07-23 — Phase 07 Plan 02 (gameStore REST refactor) complete

## Roadmap Summary

v1.1 phases continue numbering from v1.0 (ended at Phase 5):

- Phase 6: Pure Foundations — WS URL + Envelope Parsing (WS-01, EVT-01)
- Phase 7: Monotonic Reducer (KEYSTONE) (STA-01, STA-02, RTT-01)
- Phase 8: Event Dispatch Glue (EVT-02, EVT-03)
- Phase 9: useGameSocket Composable (WS-02, WS-03, WS-04, RTT-02)
- Phase 10: Connection Status Indicator (CON-01, CON-02)
- Phase 11: Realtime E2E (RTT-03)

**Keystone gate:** The monotonic reducer (Phase 7) must land before any WS code writes `gameState`.

## Performance Metrics

**Velocity:**

- Total plans completed (v1.0): 10
- Average duration: — min

*Reset for v1.1; updated after each plan completion.*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 06 P02 | 5m | 1 tasks | 2 files |
| Phase 07 P01 | 10m | 1 tasks | 2 files |
| Phase 07 P02 | 8m | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Research]: Add exactly one runtime dependency — `@vueuse/core` (`useWebSocket`) — for reactive status + capped exponential backoff; native `WebSocket` is the zero-dep fallback. Avoid `socket.io-client` / `reconnecting-websocket`.
- [Research/KEYSTONE]: Idempotency alone is unsafe against stale-but-different states. Extract a single shared monotonic `applyGameState`/`applyPlayResult` reducer gated on `play_counter`; both REST and WS funnel through it. `fetchPlayResult` already half-built this guard (~lines 273–288).
- [Research]: Testing reuses existing toolchain — `vi.stubGlobal('WebSocket', FakeWebSocket)` + fake timers for unit/store; Playwright `page.routeWebSocket()` (≥1.48, installed 1.61.1) for E2E.
- [07-01]: Reducer module named `src/game/gameStateReducer.js` (per plan frontmatter, superseding CONTEXT.md's discretionary example name `monotonicReducer.js`). Single export `applyGameState(current, incoming)`; internal private helper `isNewer`.
- [07-02]: fetchGame and updateGameStateFromPlayResult both route through applyGameState (D-07/D-08); fetchPlayResult's independent playResults array-push gate (D-09) untouched

### Pending Todos

None yet.

### Blockers/Concerns

Open gaps to resolve during phase discussion (from research SUMMARY.md — don't block roadmap, shape Phases 6–9):

- [Phase 6/9]: Exact `ws://` path / game-id scoping for `GET /game/ws` — is game id in path/query? Affects `toWebSocketUrl` + per-game lifecycle.
- [Phase 9]: Does `GET /state` return `play_counter`? The resync race guard depends on it; if absent, fall back to "cannot order → resync wins once."
- [Phase 6/8]: Exact per-variant `data` field shapes (GameState vs lineup vs play_type vs PlayAndState) — needed to finalize dispatch mapping + per-variant tests.
- [Phase 9]: Does the WS handshake share REST auth? (cookie/session vs token-in-query; browsers can't set WS headers.)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Realtime Polish | RTP-01 origin-filtered opponent-action toasts | Deferred | v1.1 scope |
| Realtime Polish | RTP-02 heartbeat/liveness detection | Deferred | v1.1 scope |
| CI | CI-01/02/03 GitHub Actions | Deferred | from v1.0 |
| Coverage | COV-01 enforced thresholds | Deferred | from v1.0 |

## Session Continuity

Last session: 2026-07-30T18:27:10.640Z
Stopped at: Phase 8 context gathered
Resume file: .planning/phases/08-event-dispatch-glue/08-CONTEXT.md

## Operator Next Steps

- Plan the first phase with `/gsd-plan-phase 6`
