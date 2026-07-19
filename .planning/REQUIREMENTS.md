# Requirements: SPF App — v1.1 Realtime

**Defined:** 2026-07-18
**Milestone:** v1.1 Realtime
**Core Value (milestone):** The UI reflects server-side game events — especially the opponent's actions — in real time over a read-only WebSocket, while all client operations continue over REST and the backend-authoritative model is preserved.

## v1.1 Requirements

Requirements for the Realtime milestone. Each maps to a roadmap phase. REQ-IDs continue the project's category-based scheme.

### WebSocket Client & Connection

- [x] **WS-01**: A pure `toWebSocketUrl` helper derives the socket URL from `VITE_API_BASE_URL` (http→ws, https→wss) and appends the `/game/ws` path — no new env var, unit-tested
- [ ] **WS-02**: A `useGameSocket()` composable opens a read-only WebSocket to `/game/ws` when a game is active and closes it on route-leave / unmount (no leaked or duplicate sockets, incl. across Vite HMR)
- [ ] **WS-03**: The socket auto-reconnects with exponential backoff (capped) after an unexpected drop
- [ ] **WS-04**: On every (re)connect, the app resyncs authoritative state via `GET /state`, routed through the same monotonic apply guard so a stale snapshot cannot clobber newer live state

### Event Parsing & Dispatch

- [x] **EVT-01**: A pure, Vue-free `src/game/gameEvents.js` parses the tagged `{ event, data }` envelope and rejects malformed/unknown envelopes without throwing (unit-tested, no mocking)
- [ ] **EVT-02**: All 5 event variants are dispatched to the correct store action: `GameStarted` (state), `OffensiveLineupSet` (lineup), `DefensiveLineupSet` (lineup), `NextPlayTypeSet` (play_type), `PlayRun` (full `PlayAndState`)
- [ ] **EVT-03**: The `PlayRun` event applies the full resulting `GameState` carried in its payload (the opponent's new state), unwrapping the WS superset shape correctly

### State Application (Convergence)

- [ ] **STA-01**: A single shared monotonic reducer applies incoming `GameState` gated on `play_counter` (reject states not newer than current); BOTH the existing REST play path and the new WS path funnel through it
- [ ] **STA-02**: Applying the same or an older state is a safe no-op (idempotent/convergent) — no flicker, no regression, verified when REST and WS deliver the same play

### Connection Status UI

- [ ] **CON-01**: Connection status (live / reconnecting / disconnected) is held in the store and reactively reflected by a `ConnectionStatus` UI indicator
- [ ] **CON-02**: The indicator updates on connect, drop, reconnect attempts, and successful reconnect

### Realtime Tests

- [ ] **RTT-01**: Unit tests cover `toWebSocketUrl` and `gameEvents.js` parse/dispatch with zero mocking (pure logic), and the monotonic reducer's ordering/idempotency behavior
- [ ] **RTT-02**: Store-level tests drive `useGameSocket()`/apply paths with a stubbed WebSocket (`vi.stubGlobal`), covering connect, event apply, drop→reconnect, and resync
- [ ] **RTT-03**: A Playwright E2E uses `page.routeWebSocket()` to impersonate the WS server, asserting the UI updates from an opponent `PlayRun` event and that the status indicator reflects a forced disconnect/reconnect

## Future Requirements

Deferred to a later milestone. Tracked, not in this roadmap.

### Realtime Polish

- **RTP-01**: Origin-filtered opponent-action notifications (toasts/highlights), suppressed during reconnect resync — deferred until base sync is proven
- **RTP-02**: Heartbeat/liveness detection distinct from event traffic

### From v1.0 (still deferred)

- **CI-01/02/03**: GitHub Actions for unit/component + E2E, coverage surfaced
- **COV-01**: Enforced coverage thresholds

## Out of Scope

Explicitly excluded for v1.1.

| Feature | Reason |
|---------|--------|
| Client→server WebSocket commands | `/game/ws` is read-only; all operations remain REST |
| Removing/rewriting REST optimistic behavior | WS is an additive inbound channel, not a write-path rewrite |
| CRDT / OT / conflict-resolution sync | Backend-authoritative + monotonic snapshot apply is sufficient |
| Event replay buffer / gap reconstruction | Reconnect resync via `GET /state` snapshot is simpler and correct |
| Presence / lobby / opponent-online indicators | Beyond the read-only game-event scope |
| Opponent-action toasts/animations | Deferred to Future (RTP-01) until base sync is proven |

## Traceability

Filled during roadmap creation (2026-07-19).

| Requirement | Phase | Status |
|-------------|-------|--------|
| WS-01 | Phase 6 | Complete |
| WS-02 | Phase 9 | Pending |
| WS-03 | Phase 9 | Pending |
| WS-04 | Phase 9 | Pending |
| EVT-01 | Phase 6 | Complete |
| EVT-02 | Phase 8 | Pending |
| EVT-03 | Phase 8 | Pending |
| STA-01 | Phase 7 | Pending |
| STA-02 | Phase 7 | Pending |
| CON-01 | Phase 10 | Pending |
| CON-02 | Phase 10 | Pending |
| RTT-01 | Phase 7 | Pending |
| RTT-02 | Phase 9 | Pending |
| RTT-03 | Phase 11 | Pending |

**Coverage:**

- v1.1 requirements: 14 total
- Mapped to phases: 14 (100%) ✓ — no orphans

---
*Requirements defined: 2026-07-18*
