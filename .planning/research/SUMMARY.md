# Project Research Summary

**Project:** SPF App — v1.1 Realtime
**Domain:** Read-only WebSocket event channel added to an existing backend-authoritative Vue 3 + Pinia + Vite SPA
**Researched:** 2026-07-18
**Confidence:** HIGH

## Executive Summary

v1.1 adds a **read-only** WebSocket channel (`GET /game/ws`) to the existing football-game SPA so the UI reflects server-side changes live — especially the opponent's actions — while all writes stay on REST and the backend stays authoritative. The socket emits a tagged `{ event, data }` envelope with 5 variants (`GameStarted`, `OffensiveLineupSet`, `DefensiveLineupSet`, `NextPlayTypeSet`, `PlayRun`). Expert practice for this shape is deliberately minimal: a thin reactive socket wrapper, pure parse/dispatch logic isolated from the transport, and a single store write path that both REST and WS funnel through. The converged technical direction is to add exactly **one runtime dependency — `@vueuse/core` (`useWebSocket`)** — for reactive status + auto-reconnect with functional exponential backoff, keeping native `WebSocket` (zero-dep) as the fallback. Do **not** add `socket.io-client` (wrong protocol for a plain WS) or `reconnecting-websocket` (unmaintained).

The architecture mirrors v1.0's proven layering (domain → store → component → E2E): a Vue-free `src/game/gameEvents.js` for `parseEvent`/`dispatchEvent` (unit-testable like `playOutcome.js`), a `useGameSocket()` composable that owns **only** lifecycle/reconnect/resync (no state, no parsing), connection status held in `gameStore`, and a `ws://` URL derived from `VITE_API_BASE_URL` via a pure `toWebSocketUrl` helper (no new env var). Testing reuses the existing toolchain: Vitest with `vi.stubGlobal('WebSocket', FakeWebSocket)` (jsdom has no WebSocket) for units/stores, and Playwright's first-class `page.routeWebSocket()` (≥1.48, available in the installed 1.61.1) for E2E — no separate mock-server process.

**The keystone risk — and the one correction that must be carried forward:** the milestone as written says safety comes "purely from idempotency, with no `play_counter` guard." Direct code review of `gameStore.js` contradicts three planning assumptions: (a) `runPlay()` does **not** optimistically apply state today — it only sets `gameMsg`; (b) `fetchPlayResult()` **already contains a monotonic `play_counter` guard** (~lines 273–288); (c) the wholesale `gameState.value = { ...new_state }` replace is idempotent only for the *same* state — applying an *older* state is a silent regression, not a no-op. Idempotency de-dupes identical payloads; it does nothing against stale-but-different ones. The converged design agreed across ARCHITECTURE + PITFALLS + FEATURES is therefore: **extract a single shared monotonic reducer (`applyGameState`/`applyPlayResult`) gated on `play_counter` that BOTH the REST path and the WS path funnel through.** This reuses machinery the code already has and turns "idempotency" into true convergence. **This reducer must exist before the WS path is allowed to write `gameState`.**

## Key Findings

### Recommended Stack

Add exactly one runtime dependency and consume the socket through a thin project composable. All required capabilities (reactive `status`/`data`, auto-reconnect with exponential backoff, scope-dispose teardown) ship in the recommended tools at the versions the repo already runs. Zero additional dev dependencies — Vitest 3.2.7 and Playwright 1.61.1 are already installed.

**Core technologies:**
- `@vueuse/core@^14.3.0` (`useWebSocket`) — reactive WebSocket client wrapping native `WebSocket` — idiomatic Vue 3 primitive; gives reconnect/backoff + reactive status without owning fragile reconnect code. Configure `autoReconnect` with a functional `delay` for true exponential backoff + cap; `onConnected` fires the `GET /state` resync.
- Native `WebSocket` (built-in) — the correct wire protocol for a plain read-only `/game/ws`; the **zero-dep fallback** if the team wants no new packages (the read-only surface is small).
- Thin `src/composables/useGameSocket.js` — derives the ws URL, wires `onmessage → parseEvent → dispatchEvent`, owns lifecycle; keeps semantics out of components (mirrors the `src/game/` discipline).

**Explicitly avoid:** `socket.io-client` (own handshake/framing — fails against a raw WS), `reconnecting-websocket` (unmaintained since 2022), hand-rolled global socket singletons (lifecycle leaks), STOMP/MQTT/GraphQL-WS (wrong protocol).

**Testing:** `vi.stubGlobal('WebSocket', FakeWebSocket)` + `vi.useFakeTimers()` for deterministic backoff; Playwright `page.routeWebSocket()` to impersonate the server (send envelopes, force close to test reconnect).

### Expected Features

The core value is reflecting the **opponent's** server-side actions live and trustworthily. Everything hinges on one linchpin: idempotent/monotonic state application, which lets REST and WS coexist without flicker or double-apply.

**Must have (table stakes):**
- Per-game connect on `/game`, clean teardown on leave — no leaked sockets
- Envelope unwrap `{ event, data }` → dispatch map for all 5 variants (unknown tags logged + ignored)
- **Idempotent + monotonic state application** (the linchpin) — `PlayRun` applies its full resulting `GameState`
- Auto-reconnect with backoff + jitter + cap
- Resync via `GET /state` on every (re)connect — routed through the same version guard
- Stale/late-event ordering guard via `play_counter`
- 3-state connection indicator: live / reconnecting / disconnected
- Mocked-socket unit/store tests + Playwright mock-WS E2E

**Should have (competitive, add after base proven):**
- Opponent-action toast — **origin-filtered** (opponent vs self, via the `teamStore` managed-team concept); suppress toasts during resync
- Changed-region highlight/pulse; reconnect polish (attempt count / countdown / manual "Reconnect now"); "synced Xs ago" freshness

**Defer (v2+):**
- Heartbeat/liveness ping-pong (only if half-open sockets prove real and backend supports it)
- Presence/online indicators (needs a channel beyond the read-only game socket)

**Anti-features (explicitly out):** client→server WS commands; removing REST optimistic apply; CRDT/OT/conflict-merge; client-side replay buffer / gap reconstruction; presence/lobby; toasting the user's own echoed actions; animating the resync snapshot; blocking UI while disconnected; multiplexing games over one socket.

### Architecture Approach

Add **one new layer boundary** (the live transport) and **one new pure module** (event parse/dispatch), reusing v1.0's `src/game/` isolation discipline. The socket owns no state — it feeds the existing `gameStore` write path. Data flow is strictly server→client; REST remains the write path; WS is purely additive inbound.

**Major components:**
1. `src/game/gameEvents.js` (pure, no Vue/WS/axios) — `parseEvent(raw)` unwraps `{ event, data }` → `{ type, payload }`; `dispatchEvent(store, event)` maps each variant to the correct store mutation. Also home for the pure `toWebSocketUrl(baseUrl)` helper (http→ws, https→wss, `/game/ws` path, trailing-slash handling).
2. `gameStore` (extended) — the **single monotonic write path** `applyServerEvent`/`applyGameState` + extracted `applyPlayResult` (shared `play_counter` guard) + `connectionStatus` ref + `resync()`.
3. `src/composables/useGameSocket.js` (new) — owns WebSocket lifecycle: connect / reconnect+backoff / resync-on-open; injects a `socketFactory` for tests; ties teardown to the game route.
4. `ConnectionStatus.vue` (new) — reads `gameStore.connectionStatus` via `storeToRefs`; renders live/reconnecting/disconnected.

### Critical Pitfalls

1. **"Idempotency" ≠ ordering — an old event overwrites newer state.** Wholesale `{ ...new_state }` replace is last-writer-wins, and the network decides who writes last. **Avoid:** make apply *monotonic/convergent* — apply only if `incoming.play_counter >= current.play_counter`, centralized in one `applyGameState` reducer both REST and WS call. The code already half-built this in `fetchPlayResult`; generalize it.
2. **Double-apply flicker.** REST result and WS `PlayRun` both apply the same play but aren't byte-identical (PlayRun is a superset of REST `/play`), so the wholesale replace re-renders twice. **Avoid:** route both through the reducer; short-circuit (skip assignment → no new reference → no re-render) when `play_counter` is unchanged.
3. **Reconnect resync races live events.** A stale `GET /state` snapshot (counter 40) can clobber newer socket events (counter 42). **Avoid:** run `/state` through the same monotonic reducer so lower-counter snapshots are ignored; don't gate live events behind resync.
4. **Socket leaks on route leave / unmount / HMR.** Stacked sockets multiply event application and defeat idempotency. **Avoid:** idempotent `connect`/`disconnect`, lifecycle tied to `GameView`, `import.meta.hot.dispose(() => disconnect())`.
5. **Reconnect storm.** Backoff-less reconnect hammers a down backend. **Avoid:** exponential backoff + jitter + cap (~30s), reset only after a *stably* open connection, give up on permanent handshake failures (401/403/404) and surface it in the status chip.
6. **Envelope/type + snake_case mismatch.** Passing `{event,data}` where a bare `GameState` is expected, or `data` instead of `data.new_state` for `PlayRun`; a camelCase access returns `undefined` and silently disables the guard. **Avoid:** one boundary adapter with per-variant extraction; keep snake_case; `Number.isFinite(play_counter)` before ordering; a store test per variant.
7. **Missed-events history gap.** State-only resync restores the scoreboard but leaves holes in the play log. **Avoid:** detect the gap and backfill via the existing `fetchAllPlayResults()` / `fullSync` path, or surface "you may have missed plays."

## Implications for Roadmap

Suggested phases follow the pitfalls-mandated ordering: **the single monotonic reducer is the keystone and must land before the WS path can write state.** Build order flows strictly upward (pure → store → glue → transport → UI → E2E), matching v1.0's domain→store→component→E2E layering.

### Phase 1: Pure foundations — URL + envelope parsing
**Rationale:** No dependencies; fastest feedback; establishes the wire contract. Mirrors v1.0's zero-mock `playOutcome` tests.
**Delivers:** `toWebSocketUrl(baseUrl)` (http→ws/https→wss, `/game/ws`, trailing-slash) and `gameEvents.parseEvent(raw)` (unwrap, malformed→ignore), fully unit-tested.
**Addresses:** envelope unwrap + dispatch (table stakes).
**Avoids:** Pitfall 6 (envelope/snake_case) at the parse boundary; hardcoded `ws://` security trap.

### Phase 2: The monotonic reducer (KEYSTONE)
**Rationale:** Idempotency-as-written is unsafe; convergence must exist before any WS write. Highest-risk logic, built and tested in isolation first.
**Delivers:** extract the existing `play_counter` guard into a shared `applyGameState`/`applyPlayResult`; add `gameStore.applyServerEvent` + `connectionStatus` ref; idempotency/ordering unit tests (out-of-order events converge to newest; same-counter causes no new reference).
**Uses:** existing `updateGameStateFromPlayResult` + `fetchPlayResult` guard machinery.
**Avoids:** Pitfalls 1, 2 (regression + flicker). **Nothing downstream may write `gameState` except through this reducer.**

### Phase 3: Dispatch glue
**Rationale:** Trivial once (1)+(2) exist; wires parsed events to the reducer.
**Delivers:** `gameEvents.dispatchEvent(store, event)` + full 5-variant mapping table tested against a fake store (`PlayRun → data.new_state`, etc.).
**Avoids:** Pitfall 6 per-variant extraction errors.

### Phase 4: `useGameSocket` composable — lifecycle, reconnect, resync
**Rationale:** Imperative/stateful transport comes after the pure+store core is proven.
**Delivers:** `useWebSocket`-based composable with `autoReconnect` (exponential backoff + jitter + cap + give-up), `onConnected → resync()` via `GET /state` (through the reducer), idempotent `connect`/`disconnect`, HMR dispose; injected `socketFactory`; `vi.stubGlobal` + fake-timer tests.
**Implements:** the live-transport layer + `connectionStatus` transitions.
**Avoids:** Pitfalls 3, 4, 5, 7 (resync race, leaks, storm, history gap), Pitfall 7 stale closures (forward every message to a store action).

### Phase 5: ConnectionStatus.vue + view wiring
**Rationale:** UI is thin once status lives in the store.
**Delivers:** `ConnectionStatus.vue` (live/reconnecting/disconnected via `storeToRefs`); mount `useGameSocket` per active game in `GameView`/`GameLayout` (`onMounted`/`onUnmounted`).
**Addresses:** connection-status indicator (table stakes).

### Phase 6: Playwright E2E vs mock WS server
**Rationale:** Validates the whole inbound path end-to-end; depends on all above.
**Delivers:** E2E using `page.routeWebSocket()` — drive envelopes, force close to exercise reconnect/resync and the status indicator.
**Addresses:** mocked-WS E2E (table stakes).

### Phase Ordering Rationale
- Dependencies flow strictly upward; the reducer (Phase 2) is a hard gate — every later writer routes through it, so convergence holds from day one.
- Pure logic first (Phases 1, 3) gives zero-infra fast feedback and isolates the hardest-to-mock semantics (message→state) from the socket.
- Reconnect/resync/backfill (Phase 4) is grouped because Pitfalls 3, 5, 7, 8 all live at the transport boundary and share the reducer's safety.
- Opponent-vs-self notifications, highlights, and reconnect polish are **P2 differentiators** — deferrable after base sync is proven; they can extend Phase 5 or form a later phase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (reconnect/resync):** confirm backoff tuning against the real backend (values are MEDIUM-confidence starting points); confirm resync-vs-live reconciliation and whether history backfill is in-scope for v1.1.
- **Phases 1/2/3 (contracts):** need the exact per-variant `data` shapes and whether `GET /state` returns `play_counter` before the mapping/guard can be finalized (see Gaps).

Phases with standard patterns (skip research-phase):
- **Phase 5 (ConnectionStatus + wiring):** ordinary Vuetify SFC + composable mount; well-trodden.
- **Phase 6 (Playwright E2E):** first-class `page.routeWebSocket()` API, documented and already available.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions live-queried from npm; VueUse + Playwright APIs verified against official docs; installed versions confirmed in `package.json`. |
| Features | HIGH | Grounded in PROJECT.md decisions + established realtime UX patterns; linchpin reinforced by actual code. |
| Architecture | HIGH | Integration mechanics verified against actual `gameStore.js` + existing ARCHITECTURE.md; backoff tuning MEDIUM (tunable defaults). |
| Pitfalls | HIGH | Codebase-specific findings verified directly against `gameStore.js`; general WS patterns MEDIUM-HIGH (widely documented). |

**Overall confidence:** HIGH

### Gaps to Address

Resolve these during phase discussion (they don't block the roadmap but shape Phases 1–4):

- **Exact `ws://` path / game-id scoping** for `GET /game/ws` — is the game id in the path/query? Affects `toWebSocketUrl` and per-game lifecycle. → Confirm during Phase 1/4 discussion.
- **Does `GET /state` return `play_counter`?** The resync race guard depends on it. → Confirm before Phase 4; if absent, negotiate or fall back to a "cannot order → resync wins once" strategy.
- **Exact per-variant `data` field shapes** (GameState vs lineup vs play_type vs PlayAndState) — needed to finalize the dispatch mapping and per-variant tests. → Confirm during Phase 1/3 discussion.
- **Origin/attribution field** distinguishing opponent vs self — required for P2 origin-filtered toasts (reuse `teamStore` managed-team). → Confirm before P2 notification work.
- **Does the WS handshake share REST auth?** (cookie/session vs token-in-query; browsers can't set WS headers.) Security + connect reliability. → Confirm during Phase 4 discussion.

## Sources

### Primary (HIGH confidence)
- `src/stores/gameStore.js` (read directly) — existing `play_counter` guard (~273–288), wholesale replace (~353), `runPlay` does not optimistically apply (~240–266), `fetchGameData(fullSync)`, `fetchAllPlayResults`, `VITE_API_BASE_URL` usage.
- `.planning/PROJECT.md` — v1.1 milestone decisions (read-only, idempotent apply, reconnect+resync, status indicator, 5 event variants).
- `.planning/codebase/ARCHITECTURE.md` — layered architecture, wholesale `gameState` replace, `src/game/` purity discipline.
- npm registry (live 2026-07-18) — `@vueuse/core@14.3.0`, `reconnecting-websocket@4.4.0` (unmaintained), `partysocket@1.3.0`, `@playwright/test@1.61.1`; `package.json` for installed versions.
- vueuse.org `useWebSocket` (v14.3.0) — `status`/`data`, callbacks, `autoReconnect` functional `delay`, scope-dispose.
- playwright.dev — `page.routeWebSocket()` availability (since 1.48).

### Secondary (MEDIUM confidence)
- Established WS + SPA engineering patterns — monotonic/version-guarded apply, exponential backoff + jitter + cap, lifecycle teardown, HMR dispose, wss scheme derivation, stale-closure hazards. Backoff values are tunable defaults to validate against the real backend.
- Realtime UX patterns (connection status, reconnect, missed-event resync vs replay) — MDN + managed-service (Ably/Pusher) / Phoenix Channels idioms.

### Tertiary (LOW confidence)
- None — no external search provider configured this run; codebase-specific claims cross-checked against actual source.

---
*Research completed: 2026-07-18*
*Ready for roadmap: yes*
