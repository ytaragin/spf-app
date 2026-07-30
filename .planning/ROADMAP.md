# Roadmap: SPF App — v1.1 Realtime

**Milestone:** v1.1 Realtime
**Granularity:** standard
**Mode:** mvp (vertical slices)
**Parallelization:** enabled
**Phase numbering:** continues from v1.0 (ended at Phase 5) — v1.1 starts at Phase 6

## Core Value

The UI reflects server-side game events — especially the opponent's actions — in real time over a read-only WebSocket, while all client operations continue over REST and the backend-authoritative model is preserved.

## Architectural Keystone (build-order gate)

A single shared **monotonic reducer** (STA-01/STA-02), gated on `play_counter`, that BOTH the existing REST play path and the new WS path funnel through, **MUST** exist before any WebSocket code is allowed to write `gameState`. Build order flows strictly upward, mirroring v1.0's proven layering (pure → store/reducer → dispatch → composable/lifecycle → UI → E2E):

1. Pure, Vue-free foundations (`toWebSocketUrl`, `gameEvents` parse)
2. **Keystone:** shared monotonic reducer + convergent apply (REST path refactored to use it too)
3. Event dispatch to store actions (incl. `PlayRun` full-state)
4. `useGameSocket` composable (lifecycle / backoff-reconnect / resync-on-open)
5. Connection status in store + `ConnectionStatus` indicator
6. E2E (`page.routeWebSocket`)

## Phases

- [x] **Phase 6: Pure Foundations — WS URL + Envelope Parsing** - Vue-free `toWebSocketUrl` and `gameEvents.parseEvent`, zero-mock unit tests
- [ ] **Phase 7: Monotonic Reducer (KEYSTONE)** - Single shared `play_counter`-gated apply path; REST refactored to use it; ordering/idempotency tests
- [ ] **Phase 8: Event Dispatch Glue** - Map all 5 envelope variants to store actions; `PlayRun` unwraps full resulting `GameState`
- [ ] **Phase 9: useGameSocket Composable** - Lifecycle, backoff-reconnect, resync-on-open via `GET /state`; stubbed-socket store tests
- [ ] **Phase 10: Connection Status Indicator** - `connectionStatus` in store + reactive `ConnectionStatus` UI, wired per active game
- [ ] **Phase 11: Realtime E2E** - Playwright `page.routeWebSocket()` drives opponent `PlayRun` + forced disconnect/reconnect

## Phase Details

### Phase 6: Pure Foundations — WS URL + Envelope Parsing

**Goal**: Establish the wire contract in pure, Vue-free modules that mirror the existing `src/game/` zero-mock testing style
**Mode:** mvp
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: WS-01, EVT-01
**Success Criteria** (what must be TRUE):

  1. `toWebSocketUrl(baseUrl)` derives `ws://` from `http://` and `wss://` from `https://`, appends `/game/ws`, and handles trailing slashes — with no new env var introduced
  2. `gameEvents.parseEvent(raw)` unwraps the tagged `{ event, data }` envelope into a normalized shape for known variants
  3. Malformed or unknown envelopes are rejected (logged + ignored) without throwing
  4. Both modules are covered by unit tests with zero mocking (pure logic), consistent with `playOutcome.js`

**Plans**: 2/2 plans executed
Plans:

- [x] 06-01-PLAN.md — Pure `toWebSocketUrl` module + zero-mock tests (WS-01)
- [x] 06-02-PLAN.md — Pure `gameEvents.parseEvent` module + zero-mock tests (EVT-01)

**Parallelization**: `toWebSocketUrl` (WS-01) and `gameEvents.parseEvent` (EVT-01) are independent pure modules — Wave 1 can build/test both in parallel.

### Phase 7: Monotonic Reducer (KEYSTONE)

**Goal**: One shared, `play_counter`-gated apply path that both the existing REST play path and the future WS path funnel through, turning "idempotency" into true convergence
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: STA-01, STA-02, RTT-01
**Success Criteria** (what must be TRUE):

  1. A single `applyGameState`/`applyPlayResult` reducer applies incoming `GameState` only when `play_counter` is newer than current, and the existing REST play path is refactored to route through it
  2. Applying the same state produces no new reference (no re-render/flicker); applying an older state is a safe no-op (no regression)
  3. Out-of-order applies converge to the newest state regardless of arrival order
  4. Unit tests cover the reducer's ordering and idempotency behavior, and (folded from Phase 6) the pure `toWebSocketUrl`/`gameEvents` parse — satisfying RTT-01's pure + reducer coverage

**Plans**: 2/2 plans executed
Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Pure `applyGameState` monotonic reducer + zero-mock tests (STA-01, STA-02, RTT-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02-PLAN.md — Refactor `fetchGame`/`updateGameStateFromPlayResult` to route through the reducer; confirm folded-in RTT-01 pure coverage (STA-01, RTT-01)

**Note**: Hard gate — nothing downstream may write `gameState` except through this reducer. REST optimistic behavior is preserved (additive refactor, not a rewrite).

### Phase 8: Event Dispatch Glue

**Goal**: Wire parsed events to the correct store mutations for all 5 variants, so incoming events reach the keystone reducer
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: EVT-02, EVT-03
**Success Criteria** (what must be TRUE):

  1. `dispatchEvent(store, event)` routes each of the 5 variants (`GameStarted`, `OffensiveLineupSet`, `DefensiveLineupSet`, `NextPlayTypeSet`, `PlayRun`) to the correct store action
  2. A `PlayRun` event applies the full resulting `GameState` carried in its payload (`data.new_state`), unwrapping the WS superset shape correctly
  3. All `GameState`-bearing variants land through the monotonic reducer (never a raw wholesale replace)
  4. Per-variant tests against a fake store verify correct extraction and dispatch (folds into RTT-01/RTT-02 coverage)

**Plans**: 3 plans

Plans:
**Wave 1**

- [ ] 08-01-PLAN.md — PlayRun slice: pure `dispatchEvent` module + `applyPlayResult` store action (EVT-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 08-02-PLAN.md — GameStarted + lineup slice: `applyIncomingGameState` / `applyLineup` + 3 dispatch branches

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 08-03-PLAN.md — NextPlayTypeSet slice, 5-variant coverage proof, D-13 flow-regression discharge

### Phase 9: useGameSocket Composable

**Goal**: A read-only WebSocket transport that connects per active game, reconnects with backoff, and resyncs on every (re)connect — owning lifecycle only, no state or parsing
**Mode:** mvp
**Depends on**: Phase 8
**Requirements**: WS-02, WS-03, WS-04, RTT-02
**Success Criteria** (what must be TRUE):

  1. `useGameSocket()` opens a read-only socket to `/game/ws` when a game is active and closes it on route-leave/unmount with no leaked or duplicate sockets (incl. across Vite HMR)
  2. After an unexpected drop, the socket auto-reconnects with capped exponential backoff (+ jitter), resetting only after a stably open connection
  3. On every (re)connect, the app resyncs via `GET /state` routed through the monotonic reducer, so a stale snapshot cannot clobber newer live state
  4. Store-level tests drive connect / event-apply / drop→reconnect / resync with a stubbed `WebSocket` (`vi.stubGlobal`) and fake timers, satisfying RTT-02

**Plans**: TBD
**Note**: Adds exactly one runtime dependency — `@vueuse/core` (`useWebSocket`). Read-only socket only (no client→server WS). No replay buffer / CRDT / presence.

### Phase 10: Connection Status Indicator

**Goal**: Surface live connection state to the user via a reactive store-backed indicator, wired for the active game
**Mode:** mvp
**Depends on**: Phase 9
**Requirements**: CON-01, CON-02
**Success Criteria** (what must be TRUE):

  1. Connection status (live / reconnecting / disconnected) is held in the store and reactively reflected by a `ConnectionStatus` UI indicator via `storeToRefs`
  2. The indicator updates on connect, drop, reconnect attempts, and successful reconnect
  3. `useGameSocket` is mounted per active game in the game view/layout and torn down cleanly on leave

**Plans**: TBD
**UI hint**: yes

### Phase 11: Realtime E2E

**Goal**: Prove the whole inbound realtime path end-to-end against an impersonated WS server
**Mode:** mvp
**Depends on**: Phase 10
**Requirements**: RTT-03
**Success Criteria** (what must be TRUE):

  1. A Playwright E2E uses `page.routeWebSocket()` to impersonate the WS server (no separate mock-server process)
  2. The test asserts the UI updates from an opponent `PlayRun` event delivered over the socket
  3. The test forces a disconnect/reconnect and asserts the status indicator reflects the transition and resync

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Pure Foundations | 2/2 | In Progress|  |
| 7. Monotonic Reducer (KEYSTONE) | 2/2 | In Progress|  |
| 8. Event Dispatch Glue | 0/? | Not started | - |
| 9. useGameSocket Composable | 0/? | Not started | - |
| 10. Connection Status Indicator | 0/? | Not started | - |
| 11. Realtime E2E | 0/? | Not started | - |

## Coverage

- v1.1 requirements: 14 total
- Mapped to phases: 14 (100%) ✓
- Orphaned: none

| Requirement | Phase |
|-------------|-------|
| WS-01 | Phase 6 |
| EVT-01 | Phase 6 |
| STA-01 | Phase 7 |
| STA-02 | Phase 7 |
| RTT-01 | Phase 7 |
| EVT-02 | Phase 8 |
| EVT-03 | Phase 8 |
| WS-02 | Phase 9 |
| WS-03 | Phase 9 |
| WS-04 | Phase 9 |
| RTT-02 | Phase 9 |
| CON-01 | Phase 10 |
| CON-02 | Phase 10 |
| RTT-03 | Phase 11 |

---
*Roadmap created: 2026-07-19 — v1.1 Realtime*
