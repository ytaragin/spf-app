# Feature Research

**Domain:** Realtime WebSocket-driven UI updates for a turn-based, backend-authoritative game SPA (Vue 3 + Pinia)
**Researched:** 2026-07-18
**Confidence:** HIGH

> Scope: ONLY the NEW v1.1 realtime features. The read-only `GET /game/ws` channel emits 5 tagged events (`GameStarted`, `OffensiveLineupSet`, `DefensiveLineupSet`, `NextPlayTypeSet`, `PlayRun`). Its core value is reflecting the **opponent's** server-side actions in the UI live. All writes stay on REST; backend stays authoritative; WS is an additive inbound state channel made safe by idempotent state application.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing these makes the realtime feature feel broken, flaky, or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-game WS connect on entering `/game`; disconnect on leave | A dangling socket from a previous game leaks events/state | LOW | Derive `ws(s)://` from `VITE_API_BASE_URL`; tie lifecycle to the game view (`onMounted`/`onUnmounted`) or the active-game id in `gameStore` |
| Envelope unwrap `{ event, data }` → dispatch by `event` tag | WS bodies are tagged; REST bodies are bare. A single mis-parse silently drops updates | LOW | One dispatch map `event → handler`; unknown tags logged + ignored (forward-compat) |
| Apply all 5 event variants to Pinia state | The whole point is the UI reflecting each server-side change | MEDIUM | `PlayRun` carries full resulting `GameState` (superset of REST `/play`); others patch a slice (lineup / play_type / state) |
| Idempotent state application (re-apply = no-op) | REST optimistic apply + WS echo would otherwise double-apply / flicker | MEDIUM | Wholesale-replace `gameState` from server `new_state` (already the app's model). Guard slice patches so re-setting the same value is inert. This is the linchpin that makes REST+WS coexist |
| Connection-status indicator: live / reconnecting / disconnected | Users must know whether "live" is actually live before trusting the board | LOW | 3-state chip/badge (green dot / amber "reconnecting…" / grey "disconnected"). Drive from a `connectionStatus` ref in the store |
| Auto-reconnect with backoff | Networks blip; a socket that dies silently makes the game look frozen | MEDIUM | Exponential backoff with jitter + a cap (e.g. 1s→2s→4s→…→~30s). Reset backoff on a clean open |
| Resync via `GET /state` on (re)connect | While disconnected, opponent moves are missed; the socket has no replay | MEDIUM | On every successful open (initial + each reconnect), fetch `GET /state` and wholesale-apply. Closes the missed-event gap. Depends on idempotent apply |
| Stale/late-event guard (ordering) | Out-of-order or resync-vs-live races can clobber newer state with older | MEDIUM | Prefer a monotonic marker (`play_counter` / server sequence) — apply only if `incoming >= current`. This is the ordering safety net behind idempotency |
| Clean teardown on unmount / logout | Zombie sockets keep reconnecting and firing state mutations off-screen | LOW | Cancel timers, remove listeners, `close()`. Guard reconnect loop against "intentionally closed" |

### Differentiators (Competitive Advantage)

Polish that makes the realtime layer feel intentional. Not required to ship; align with "reflect the opponent's action clearly."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Opponent-action toast/snackbar ("Opponent set their lineup", "Play run: +7 yds") | Surfaces *what changed* without the user hunting the board | LOW–MEDIUM | App already has a Vuetify snackbar. Only fire for opponent-originated events to avoid echoing the user's own REST actions (see anti-features) |
| Subtle highlight/pulse on the changed region when a WS event lands | Draws the eye to the delta (new score, new play type) | MEDIUM | Vuetify transition / CSS pulse keyed to the mutated field. Keep short; respect `prefers-reduced-motion` |
| "Reconnecting…" progressive detail (attempt count / next-retry countdown) | Turns dead air into visible, trustworthy recovery | LOW | Derive from backoff state already tracked for reconnect |
| Manual "Reconnect now" affordance when disconnected | Gives users agency instead of waiting out backoff | LOW | Button on the disconnected indicator; resets backoff and forces a connect attempt |
| Last-event / "synced Xs ago" freshness timestamp | Confidence signal that live really means live | LOW | Update on each applied event and on resync |
| Distinguish "my move echoed" vs "opponent moved" in notifications | Prevents confusing self-notifications | MEDIUM | Compare event origin to the managed team (`teamStore` managed-team toggle already exists) |
| Heartbeat / liveness detection (ping-pong or idle timeout) | Detects half-open sockets that TCP won't surface | MEDIUM | If no message within N seconds, proactively cycle the connection. Only worth it if the backend supports/echoes pings |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Client→server WS commands (send plays/lineups over the socket) | "It's already a socket, why not write over it too?" | Splits the write path across two transports, breaks the backend-authoritative REST model, doubles error handling. Explicitly out of scope in PROJECT.md | Keep ALL writes on REST; WS stays read-only inbound |
| Removing REST optimistic apply, relying on WS echo for own actions | "One source of truth, less code" | Own actions would feel laggy (round-trip to socket); a socket blip freezes the user's own UI | Keep REST optimistic apply; WS is additive + idempotent (the decided design) |
| Full CRDT / OT / conflict-merge sync | "Robust realtime multiplayer" buzzword | Massive complexity for a turn-based, server-authoritative game with no concurrent edits to the same field. Server already resolves order | Wholesale server-state replacement + monotonic ordering guard. No merge needed |
| Client-side event replay buffer / gap-fill reconstruction | "Never miss an event" | Reinventing durable messaging on a fire-and-forget socket; complex, bug-prone | `GET /state` resync on reconnect gives the authoritative snapshot — simpler and correct |
| Presence / lobby / "opponent is typing"/"opponent online" | Feels like "real multiplayer" | Out of scope; needs a presence channel the read-only game socket doesn't provide; scope creep | Infer activity implicitly from received game events; defer presence |
| Toasting the user's own actions (echoed via WS) | Falls out naturally from "toast every event" | Double-notifies the user for things they just did — noisy and confusing | Only notify opponent-originated events (origin/managed-team filter) |
| Animating on the resync snapshot (`GET /state`) | "Animate all state changes" | Resync applies a bulk snapshot → would fire a flurry of pulses/toasts on every reconnect | Suppress notifications/animations during resync; only animate incremental live events |
| Blocking the UI while disconnected | "Prevent acting on stale data" | REST still works offline-of-socket; blocking harms usability, and idempotent apply already reconciles | Non-blocking status indicator; let REST proceed, reconcile via resync |
| Multiplexing all games over one shared socket | "Fewer connections" | Cross-game event leakage, harder lifecycle; app is single-active-game | One socket per active game, torn down on leave |

## Feature Dependencies

```
Per-game WS connect
    └──requires──> Envelope unwrap + dispatch map
                       └──requires──> Idempotent state application  ◄── LINCHPIN
                                          ├──enables──> Auto-reconnect + backoff
                                          │                 └──requires──> Resync via GET /state
                                          └──enables──> Stale/late-event guard (monotonic ordering)

Connection-status indicator ──reads──> connect / reconnect state

Opponent-action toast ──requires──> managed-team origin filter (teamStore)
Change-region highlight ──requires──> per-slice event handlers (not just wholesale replace)
Reconnect UX polish (countdown / manual reconnect) ──enhances──> Auto-reconnect + backoff

Idempotent apply ──makes-safe──> coexistence with existing REST optimistic apply
```

### Dependency Notes

- **Everything depends on idempotent state application.** It is what lets the existing REST optimistic-apply path and the new WS path both mutate `gameState` without flicker or double-application. Build/verify this first; it's already partly true because the app wholesale-replaces `gameState` from `new_state`.
- **Resync depends on idempotent apply.** `GET /state` on reconnect applies a full snapshot; it must be a safe no-op when nothing changed and a clean overwrite when it did.
- **Stale-event guard depends on a monotonic marker.** `play_counter` (already in the payload per CONVENTIONS.md) or a server sequence number lets you reject older-than-current applies — the ordering backstop that complements idempotency during the resync-vs-live race.
- **Opponent-only notifications depend on origin filtering.** Reuse `teamStore`'s managed-team concept to tell "my echo" from "opponent's move." Without it, toasts double-fire.
- **Highlight/animation depends on per-slice handlers.** Wholesale `gameState` replace loses the "what field changed" signal; to pulse a region you need the event-level delta (which the 5 typed events already provide).

## MVP Definition

### Launch With (v1.1)

Minimum to make "the UI reflects the opponent live" true and trustworthy.

- [ ] Per-game connect/teardown on `/game` — no leaked sockets
- [ ] Envelope unwrap + dispatch for all 5 event variants
- [ ] Idempotent state application (coexists with REST optimistic apply)
- [ ] `PlayRun` applies the full resulting `GameState` from the WS payload
- [ ] Auto-reconnect with backoff + jitter and a cap
- [ ] Resync via `GET /state` on every (re)connect
- [ ] Stale/late-event guard via monotonic marker (`play_counter`/sequence)
- [ ] Connection-status indicator (live / reconnecting / disconnected)
- [ ] Store/unit tests with a mocked socket + Playwright E2E against a mock WS server

### Add After Validation (v1.x)

- [ ] Opponent-action toast (origin-filtered) — once base sync proven stable
- [ ] Changed-region highlight/pulse — when users want clearer deltas
- [ ] Reconnect polish (attempt count / countdown / manual "Reconnect now")
- [ ] "Synced Xs ago" freshness timestamp

### Future Consideration (v2+)

- [ ] Heartbeat/liveness ping-pong — only if half-open sockets prove to be a real problem and backend supports it
- [ ] Presence / online indicators — needs a channel beyond the read-only game socket

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Idempotent state application | HIGH | MEDIUM | P1 |
| Envelope unwrap + 5-event dispatch | HIGH | MEDIUM | P1 |
| `PlayRun` full-GameState apply | HIGH | LOW | P1 |
| Per-game connect/teardown | HIGH | LOW | P1 |
| Auto-reconnect + backoff | HIGH | MEDIUM | P1 |
| Resync via `GET /state` on reconnect | HIGH | MEDIUM | P1 |
| Stale-event / ordering guard | HIGH | MEDIUM | P1 |
| Connection-status indicator | HIGH | LOW | P1 |
| Mocked-socket + mock-WS E2E tests | HIGH | MEDIUM | P1 |
| Opponent-action toast (origin-filtered) | MEDIUM | LOW | P2 |
| Changed-region highlight/pulse | MEDIUM | MEDIUM | P2 |
| Reconnect polish (countdown / manual) | MEDIUM | LOW | P2 |
| Freshness timestamp | LOW | LOW | P3 |
| Heartbeat/liveness | MEDIUM | MEDIUM | P3 |
| Presence/online | LOW | HIGH | P3 |

**Priority key:** P1 = must have for the milestone · P2 = polish, add after base proven · P3 = defer.

## Competitor Feature Analysis

Common patterns across realtime web apps and libraries (Socket.IO, Ably, Phoenix Channels, Firebase Realtime, Liveblocks), read for the read-only/turn-based case:

| Feature | Typical realtime app | Managed realtime service (Ably/Pusher) | Our Approach |
|---------|----------------------|----------------------------------------|--------------|
| Connection status | live/connecting/failed states shown | Built-in connection lifecycle + status events | 3-state chip driven by store `connectionStatus` |
| Reconnect | Exponential backoff + jitter (library default) | Automatic with rewind/replay window | Backoff+jitter (hand-rolled) + `GET /state` resync (no replay window needed) |
| Missed events | Replay from a server buffer / cursor | Message rewind / history | Authoritative snapshot resync — simpler, correct for server-authoritative state |
| Ordering | Sequence numbers / channel ordering | Guaranteed ordering | Monotonic `play_counter`/sequence guard on apply |
| Conflict handling | CRDT/OT for collaborative editing | Presence + last-write-wins | Not applicable — server resolves; wholesale replace |
| Write path | Often bidirectional over the same socket | Publish over channel | REST-only writes (deliberately unidirectional WS) |

## Sources

- WebSocket UX / connection-status & reconnect patterns: MDN WebSocket API guidance; common exponential-backoff-with-jitter reconnect practice (Socket.IO / library defaults) — HIGH confidence, stable well-known patterns
- Missed-event handling via authoritative resync vs replay buffers: managed realtime service docs patterns (Ably/Pusher "connection recovery / rewind"), Phoenix Channels rejoin+refetch idiom — HIGH confidence
- Idempotency + monotonic-ordering guards for server-authoritative state: established event-application practice; reinforced by this project's existing wholesale `new_state` replacement and `play_counter` field (`.planning/PROJECT.md`, `AGENTS.md` CONVENTIONS) — HIGH confidence
- Project constraints (read-only WS, REST optimistic apply retained, 5 event variants, per-game socket): `.planning/PROJECT.md` v1.1 milestone — authoritative

---
*Feature research for: realtime WebSocket UI updates on a backend-authoritative turn-based game SPA*
*Researched: 2026-07-18*
