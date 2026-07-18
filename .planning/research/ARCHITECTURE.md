# Architecture Research

**Domain:** Read-only WebSocket integration into a Vue 3 + Pinia setup-store SPA (v1.1 Realtime)
**Researched:** 2026-07-18
**Confidence:** HIGH (integration mechanics grounded in the actual `gameStore.js` source and existing ARCHITECTURE.md; reconnect/backoff tuning is MEDIUM — standard practice, values are a starting point)

## Standard Architecture

The recommended shape adds **one new layer boundary** (a live transport) and **one new pure module** (event parse/dispatch), reusing the existing `src/game/` isolation discipline. The socket does **not** get its own state ownership — it feeds the existing `gameStore` write path.

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation (Vue SFCs)                    │
│  GameView.vue ── hosts ── GameLayout.vue                     │
│      │                                                       │
│      └── ConnectionStatus.vue  (live / reconnecting / down)  │
├─────────────────────────────────────────────────────────────┤
│                   State Layer (Pinia)                        │
│  ┌───────────────────────────┐   ┌───────────────────────┐  │
│  │ gameStore (existing)      │   │ teamStore (existing)  │  │
│  │  + connectionStatus ref   │   │                       │  │
│  │  ONE idempotent write     │◄──┤ lineups target        │  │
│  │  path: applyServerEvent() │   │                       │  │
│  └──────────▲────────────────┘   └───────────────────────┘  │
│             │ (dispatch calls store mutations)               │
├─────────────┼───────────────────────────────────────────────┤
│      Domain / Pure Logic (src/game/) — NO Vue, NO socket     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ gameEvents.js : parseEvent(raw) → {type,payload}      │   │
│  │                 dispatchEvent(store, event)           │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│      Live Transport (NEW) — thin, imperative, mockable       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ useGameSocket() composable                            │   │
│  │  owns WebSocket lifecycle: connect / reconnect /      │   │
│  │  backoff / resync-on-reconnect. Delegates every       │   │
│  │  message to parseEvent + dispatchEvent.               │   │
│  └───────────────┬──────────────────────────────────────┘   │
│                  │ ws://  (derived from VITE_API_BASE_URL)    │
└──────────────────┼───────────────────────────────────────────┘
                   ▼
         Backend  GET /game/ws  (server → client only)
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `useGameSocket()` composable | Own the live `WebSocket`: open, close, reconnect w/ backoff, trigger resync. **No parsing logic, no state shape knowledge.** | Vue composable in `src/composables/useGameSocket.js`; takes a `socketFactory` + the store; wires `onmessage → parseEvent → dispatchEvent`. |
| `gameEvents.js` (pure) | Unwrap `{ event, data }` envelope → normalized event; map each variant to the correct store mutation. **No Vue, no WebSocket, no axios.** | Pure module in `src/game/gameEvents.js`, mirroring `playOutcome.js`. `parseEvent(raw)` + `dispatchEvent(store, event)`. |
| `gameStore` (extended) | Idempotent write path + `connectionStatus` ref. Already the single source of truth for `gameState`, `lineups`, `nextPlayType`, `playResults`. | Add `applyServerEvent(event)` (or reuse existing mutators) + `connectionStatus` ref + `resync()`. |
| `ConnectionStatus.vue` | Render live / reconnecting / disconnected from `gameStore.connectionStatus`. | Small Vuetify SFC (`v-chip`/`v-icon`) in `src/components/`; read-only via `storeToRefs`. |

## Recommended Project Structure

```
src/
├── game/
│   ├── playOutcome.js        # existing pure module (reference pattern)
│   └── gameEvents.js         # NEW pure: parseEvent + dispatchEvent (no Vue/WS)
├── composables/
│   └── useGameSocket.js      # NEW: live WebSocket lifecycle + reconnect/backoff
├── stores/
│   └── gameStore.js          # EXTENDED: connectionStatus, applyServerEvent, resync
└── components/
    └── ConnectionStatus.vue  # NEW: status indicator
```

### Structure Rationale

- **`src/game/gameEvents.js`:** Envelope-unwrapping and event→mutation mapping are *pure decision logic* — exactly the class of code the project already isolates in `src/game/` (per ARCHITECTURE.md "Domain logic isolated as framework-agnostic pure classes/functions"). Keeping it pure means the entire dispatch table is unit-testable with a plain fake store object and zero socket/jsdom setup — the same zero-mock discipline that made `playOutcome` tests trivial in v1.0.
- **`src/composables/useGameSocket.js`:** The `WebSocket` object is inherently imperative and stateful (open handles, timers). A composable is the idiomatic Vue 3 home for lifecycle-bound side effects tied to a view (`onMounted`/`onUnmounted`), and it accepts an injected `socketFactory` so tests swap in a mock socket. `src/composables/` is a new but conventional folder.
- **`gameStore` stays the write owner:** `gameState` is already "the canonical game snapshot; always overwritten wholesale from server `new_state`." Adding a second state-owning store would split truth. The socket must funnel through the *same* store mutators REST uses.

## Architectural Patterns

### Pattern 1: One idempotent write path shared by REST and WS

**What:** Both REST responses and WS events converge on the **same** store mutations. The store already exposes `updateGameStateFromPlayResult(playResult)` which does `gameState.value = { ...new_state }` — a wholesale replace that is *inherently idempotent* (re-applying the same `new_state` yields the same object). WS `PlayRun` (a full `PlayAndState`) feeds this exact function. Other variants map to existing targets.

**When to use:** Always, for this milestone — it is the core requirement ("REST optimistic apply + WS apply, made safe by idempotent state application").

**Trade-offs:** Requires a guard so duplicate `PlayRun` events don't push a duplicate row into `playResults`. The store already has this guard in `fetchPlayResult` (only push when `play_counter` increased) — extract it into a shared `applyPlayResult(play)` so both REST polling and WS use the counter check. Wholesale-replace of `gameState` needs no guard.

**Example:**
```javascript
// gameStore.js — the single write path, called by REST AND by WS dispatch
function applyServerEvent(event) {
  switch (event.type) {
    case 'GameStarted':          // data = GameState
      gameState.value = { ...event.payload }
      break
    case 'OffensiveLineupSet':   // data = lineup
      lineups.value.offense = event.payload
      break
    case 'DefensiveLineupSet':
      lineups.value.defense = event.payload
      break
    case 'NextPlayTypeSet':      // data = play_type
      nextPlayType.value = event.payload
      break
    case 'PlayRun':              // data = PlayAndState (result + new_state)
      applyPlayResult(event.payload)   // counter-guarded push + updateGameStateFromPlayResult
      break
  }
}
```

### Pattern 2: Pure parse/dispatch, imperative socket (mirror `src/game/`)

**What:** Split the WS layer into (a) pure `parseEvent(raw)` that unwraps `{ event, data }` into `{ type, payload }` and validates the tag, and (b) `dispatchEvent(store, event)` that just calls `store.applyServerEvent(event)`. The composable owns only the socket + timers and calls these two functions on each message.

**When to use:** Whenever transport is stateful but the message semantics are pure — the exact situation here.

**Trade-offs:** One extra indirection layer, but it buys full testability of the hardest-to-mock logic (message → state) without a live socket.

**Example:**
```javascript
// src/game/gameEvents.js — pure, no Vue, no WebSocket
export function parseEvent(raw) {
  const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!msg || typeof msg.event !== 'string') return null   // ignore malformed
  return { type: msg.event, payload: msg.data }
}
```

### Pattern 3: Reconnect-with-backoff + resync-on-open

**What:** The composable reconnects on `close`/`error` with exponential backoff (capped), and on every *successful (re)open* triggers `gameStore.resync()` which calls the existing `fetchGameData(true)` (full sync via `GET /state` + plays). This closes the gap where events were missed while disconnected — safe precisely because apply is idempotent.

**When to use:** Any read-only realtime channel where missed messages must not leave stale state.

**Trade-offs:** Backoff values (e.g. 500ms → 1s → 2s → 5s → 10s cap, with jitter) are a starting point (MEDIUM confidence); tune against the real backend. Resync-on-open costs an extra REST round-trip per reconnect — acceptable and correct.

## Data Flow

### Inbound WS event flow

```
Backend  GET /game/ws  emits  { event, data }
    ↓ onmessage
useGameSocket (composable, imperative)
    ↓  parseEvent(raw)                → { type, payload }   (pure)
    ↓  dispatchEvent(store, event)                          (pure)
    ↓  store.applyServerEvent(event)  → SAME mutators REST uses
gameState / lineups / nextPlayType / playResults  (idempotent)
    ↓ reactive
Vue components re-render
```

### Coexistence with REST optimistic apply

```
User action ──► gameStore.runPlay() ──► POST /game/play ──► optimistic apply (existing)
                                                                     │
Backend also broadcasts PlayRun ──► WS ──► applyServerEvent ─────────┤ (idempotent:
                                                                     ▼  same new_state,
                                              gameState replaced wholesale — no artifact)
```

- **Direction is strictly server → client.** No client→server WS traffic (read-only).
- **REST remains the write path.** WS is purely additive inbound.
- **Idempotency is what makes double-apply safe:** wholesale `gameState` replace + `play_counter`-guarded `playResults` push.

### Connection status flow

```
useGameSocket lifecycle events (open/close/retry)
    ↓ set
gameStore.connectionStatus ('live' | 'reconnecting' | 'disconnected')
    ↓ storeToRefs
ConnectionStatus.vue renders indicator
```

Status lives in `gameStore` (not the composable) so any component can read it reactively and so it survives the composable's mount scope — consistent with the store owning all shared reactive state.

### ws:// URL derivation

Derive from the existing `VITE_API_BASE_URL` (no new env var):

```javascript
// pure helper (testable) — in gameEvents.js or a small url util
export function toWebSocketUrl(baseUrl) {
  const u = new URL(baseUrl)                 // e.g. http://host:8080 or https://host
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
  u.pathname = (u.pathname.replace(/\/$/, '')) + '/game/ws'
  return u.toString()
}
```
Keep this pure and unit-tested (http→ws, https→wss, trailing-slash handling) — a common source of connect bugs.

## Anti-Patterns

### Anti-Pattern 1: Socket owning game state

**What people do:** Put `gameState`/reconnect/parse all inside `useGameSocket`, or create a second Pinia store that also holds game state.
**Why it's wrong:** Splits the single source of truth; REST-apply and WS-apply drift; duplicate-application artifacts reappear. Contradicts the existing "backend-authoritative, one canonical `gameState`" model.
**Do this instead:** Socket dispatches into `gameStore`'s existing mutators. State stays in the store; the composable owns only the connection.

### Anti-Pattern 2: Parsing/dispatch logic buried in `onmessage`

**What people do:** Inline the envelope-unwrap `switch` inside the composable's `ws.onmessage` handler.
**Why it's wrong:** Forces a live/mock socket + jsdom to test the mapping, the highest-value logic. Breaks the project's `src/game/` purity discipline.
**Do this instead:** Pure `parseEvent`/`dispatchEvent` in `src/game/`; the composable is a thin wire.

### Anti-Pattern 3: No resync after reconnect

**What people do:** Reconnect and resume, assuming no messages were missed.
**Why it's wrong:** Events emitted during the outage are lost → stale UI, especially opponent actions.
**Do this instead:** On every (re)open, call `fetchGameData(true)` (`GET /state`). Idempotent apply makes this free of side effects.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `useGameSocket` ↔ `gameEvents` (pure) | direct function calls (`parseEvent`, `dispatchEvent`) | keeps all semantics testable without a socket |
| `gameEvents.dispatch` ↔ `gameStore` | calls `store.applyServerEvent()` | the ONE shared idempotent write path |
| `gameStore` ↔ `ConnectionStatus.vue` | reactive ref via `storeToRefs` | status owned by store, not composable |
| `useGameSocket` ↔ backend | `WebSocket` over `wss://…/game/ws` | URL derived from `VITE_API_BASE_URL`; inject `socketFactory` for tests |

### Testability boundary (explicit)

- **Pure, no mocks:** `parseEvent` (envelope unwrap, malformed handling), `dispatchEvent` → store-mutator mapping (fake plain store object), `toWebSocketUrl` (protocol/path derivation). Mirrors v1.0's zero-mock `playOutcome` tests.
- **Store-level (mocked socket + mocked axios):** `applyServerEvent` idempotency (apply same `PlayRun` twice → one `playResults` row, identical `gameState`); `resync` calls `GET /state`.
- **Composable (injected mock socket):** reconnect/backoff sequencing, `connectionStatus` transitions, resync-on-open — driven by a fake socket emitting `open`/`close`/`message`, no real network.
- **E2E (Playwright + mock WS server):** full inbound path end-to-end.

## Suggested Build Order

1. **`toWebSocketUrl` + `gameEvents.parseEvent`** (pure) — no dependencies; unit-testable immediately. Establishes the envelope contract.
2. **`gameStore.applyServerEvent` + `applyPlayResult` extraction + `connectionStatus` ref** — extract the existing `play_counter` guard so REST and WS share it; add idempotency tests. Depends on (1) for event shape.
3. **`gameEvents.dispatchEvent`** — trivial glue from parsed event to `store.applyServerEvent`; unit-test the full mapping table against a fake store. Depends on (1)+(2).
4. **`useGameSocket` composable** — lifecycle, reconnect/backoff, resync-on-open; injected `socketFactory`. Depends on (1)–(3).
5. **`ConnectionStatus.vue` + wiring in `GameView`/`GameLayout`** — mount `useGameSocket` per active game (`onMounted`/`onUnmounted`), render status. Depends on (4).
6. **Playwright E2E against a mock WS server** — validates the whole inbound path. Depends on all above.

Rationale: pure logic first (fastest feedback, no infra), then the store write path (idempotency is the core risk), then the imperative socket, then UI, then E2E — dependencies flow strictly upward, matching how v1.0 layered domain → store → component → E2E.

## Sources

- `.planning/codebase/ARCHITECTURE.md` — existing layered architecture, `gameState` wholesale-replace, `src/game/` purity discipline (HIGH — project's own analysis)
- `src/stores/gameStore.js` (read directly) — existing `updateGameStateFromPlayResult`, `play_counter` guard in `fetchPlayResult`, `fetchGameData(fullSync)`, `VITE_API_BASE_URL` usage (HIGH — actual source)
- `.planning/PROJECT.md` — v1.1 milestone decisions (read-only, idempotent apply, reconnect+resync, status indicator) (HIGH)
- Standard WebSocket-client + Pinia composable patterns (reconnect/backoff/jitter, resync-on-open) (MEDIUM — well-established; backoff values are tunable defaults)

---
*Architecture research for: read-only WebSocket → Vue 3 + Pinia setup-store integration*
*Researched: 2026-07-18*
