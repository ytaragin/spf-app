# Stack Research

**Domain:** Read-only browser WebSocket channel for an existing Vue 3 + Pinia + Vite SPA (v1.1 Realtime)
**Researched:** 2026-07-18
**Confidence:** HIGH

> Scope: ONLY the additive WebSocket capability. The REST/axios/Vitest/Playwright stack is already validated and is **not** re-researched here. Verified package versions live-queried from npm; API surfaces verified against official VueUse and Playwright docs (2026-07).

## Recommendation at a glance

**Add exactly one runtime dependency: `@vueuse/core@^14.3.0`, and consume the WebSocket via its `useWebSocket` composable inside a thin `src/composables/useGameSocket.js` wrapper.** Do **not** hand-roll a raw `WebSocket` + reconnection loop, and do **not** add `socket.io-client` or `reconnecting-websocket`. Test with a hand-rolled mock-socket class in Vitest (jsdom) and Playwright's first-class `page.routeWebSocket()` for E2E. All required capabilities (auto-reconnect with exponential backoff, buffered lifecycle, reactive `status`/`data`, clean teardown on scope dispose) already ship in these tools at the versions the repo runs.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@vueuse/core` (`useWebSocket`) | `^14.3.0` | Reactive WebSocket client: `status`/`data` refs, `open`/`close`, auto-reconnect w/ backoff, lifecycle callbacks, scope-dispose cleanup | Idiomatic Vue 3 Composition-API primitive; battle-tested; wraps the native `WebSocket` (no socket.io framing) so it speaks a **plain** server WS. Gives reconnection + reactive status for free — precisely the milestone's needs — without owning fragile reconnect code. Latest release 3 weeks old; actively maintained. |
| Native browser `WebSocket` API | built-in | Underlying transport (used *by* `useWebSocket`) | The server is a plain read-only WS (`GET /game/ws`), not socket.io. The native API is the correct wire protocol; VueUse only adds ergonomics on top. |
| Thin project composable `useGameSocket.js` | n/a (app code) | Derive `ws(s)://` URL from `VITE_API_BASE_URL`, unwrap the `{ event, data }` envelope, dispatch each of the 5 variants into the Pinia `gameStore`, expose connection status | Keeps envelope-parsing and store-dispatch logic testable in isolation and out of components — mirrors the existing `src/game/` "pure logic extracted from components" convention. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none required)* | — | — | The capability needs **zero** additional runtime libs beyond `@vueuse/core`. Deliberately minimal. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest `^3.2.7` (already installed) | Unit/store tests with a mocked socket | jsdom does **not** implement `WebSocket`. Provide a small fake `WebSocket` class and assign `globalThis.WebSocket = FakeWebSocket` (or `vi.stubGlobal('WebSocket', FakeWebSocket)`). Drive `onopen`/`onmessage`/`onclose` manually to simulate envelopes and disconnects. Fake advertised via `readyState` constants (`CONNECTING=0`, `OPEN=1`…). Prefer testing your `useGameSocket` envelope→store mapping directly (feed it envelopes) over asserting VueUse internals. |
| `@playwright/test` `^1.61.1` (already installed) | E2E against a mock WS server | Use `page.routeWebSocket(url, ws => …)` — Playwright's native WebSocket mocking, added in **1.48** and fully available in 1.61.1. Intercepts the browser's real `WebSocket` in-page, letting the test act as the server: `ws.onMessage(...)`, `ws.send(JSON.stringify({ event, data }))`, and `ws.close()` to exercise reconnect + status indicator. No separate mock WS server process needed. |
| `vi.useFakeTimers()` | Deterministic backoff testing | Reconnect delays are timer-driven; fake timers let store tests assert backoff without real waits. |

## Installation

```bash
# Core (the only new runtime dependency)
npm install @vueuse/core@^14.3.0

# Supporting: none

# Dev dependencies: none — Vitest 3.2.7 and Playwright 1.61.1 already installed
```

## Key integration points

**Pinia (setup stores):** Call `useGameStore()` inside `useGameSocket()` and dispatch envelopes to store actions. Because the app is backend-authoritative and REST already applies state optimistically, the WS handler must apply the **same** state idempotently (re-applying an identical `GameState` is a no-op). Add small store actions like `applyRemoteState(state)` / `applyRemoteLineup(...)` so both REST and WS paths funnel through one wholesale-replace of `gameState` (consistent with the existing "always overwrite `gameState` from server `new_state`" pattern). `PlayRun` carries a full `PlayAndState`, so apply its resulting `GameState` the same way.

**URL derivation:** Derive the socket URL from `VITE_API_BASE_URL` by swapping `http→ws`/`https→wss`. Guard for a missing env value (existing code already treats an absent base URL as a silent failure mode).

**Reconnect + resync:** Use `useWebSocket`'s `autoReconnect` with exponential backoff (see Version Compatibility). On the `onConnected` callback (fired on every (re)connect), trigger a `GET /state` resync via the existing axios path so a reconnect re-establishes truth — matching the milestone requirement.

**Lifecycle:** `useWebSocket` auto-closes on scope dispose, so calling `useGameSocket()` from the game view/layout ties socket teardown to navigation away from `/game` automatically.

**Status indicator:** Map VueUse `status` (`'CONNECTING' | 'OPEN' | 'CLOSED'`) plus an "is reconnecting" flag to the required live / reconnecting / disconnected UI states.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@vueuse/core` `useWebSocket` | **Native `WebSocket` + hand-rolled thin composable (no dep)** | Reasonable if the team is dep-averse and wants zero new packages. You then own ~40–80 lines of reconnect/backoff/heartbeat/teardown logic and its tests. VueUse gives this for free and is already the ecosystem standard — but a bespoke composable is a legitimate, defensible choice given how simple a read-only channel is. This is the *only* serious alternative. |
| `@vueuse/core` `useWebSocket` | `partysocket` `^1.3.0` | Only if you needed a framework-agnostic, robust reconnecting socket **without** Vue reactivity (e.g. shared with non-Vue code). It's the maintained successor to `reconnecting-websocket`. Overkill here since VueUse already wraps reconnection and gives reactivity. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `socket.io-client` | The server is a **plain** read-only WebSocket, not a Socket.IO endpoint. Socket.IO has its own handshake/framing/protocol and will **fail to connect** to a raw `/game/ws`. Also large and bidirectional — the opposite of this read-only need. | Native `WebSocket` (via `useWebSocket`). |
| `reconnecting-websocket` (`4.4.0`) | Effectively **unmaintained** — last published 2022-06. Adds a dependency to solve a problem VueUse already solves in-tree. | `useWebSocket`'s built-in `autoReconnect`, or `partysocket` if a standalone lib is truly required. |
| Hand-rolled global `WebSocket` singleton in `main.js` / module scope | No lifecycle binding → leaks sockets across route changes and test runs; hard to mock; fights the composable pattern the codebase uses everywhere. | Scoped `useGameSocket()` composable invoked from the game view. |
| STOMP / MQTT / GraphQL-WS clients | Wrong protocol entirely for a tagged `{ event, data }` JSON envelope over raw WS. | Plain JSON parse of `event.data`. |

## Stack Patterns by Variant

**If the team wants zero new dependencies:**
- Use native `WebSocket` inside `src/composables/useGameSocket.js` with a small reconnect timer (exponential backoff, cap ~30s) and `tryOnScopeDispose`-style cleanup.
- Because it's a *read-only* channel with no send path, the hand-rolled surface is genuinely small and fully testable with the same mock-socket approach.

**If the team wants the standard, lowest-maintenance path (recommended):**
- Use `@vueuse/core` `useWebSocket` — reconnection, backoff, reactive status, and teardown are provided and maintained upstream. Your code shrinks to envelope-unwrap + store-dispatch.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@vueuse/core@14.3.0` | `vue@^3.3.4` | VueUse 14 targets Vue 3; fully compatible with the repo's Vue 3.3+. No peer conflicts with Pinia/Vuetify/Vite 6. |
| `@vueuse/core@14.3.0` | `vite@^6.4.3` | Pure ESM library; works with Vite 6 out of the box. |
| `useWebSocket` `autoReconnect` | — | Config shape: `autoReconnect: { retries: 5, delay: (retries) => Math.min(1000 * 2 ** (retries - 1), 30000), onFailed() {…} }`. `delay` accepts a **function** of the retry count → true exponential backoff with a cap, no extra lib. `onConnected(ws)` fires on every (re)connect — the hook for the `GET /state` resync. |
| `page.routeWebSocket()` | `@playwright/test@1.61.1` | API introduced in Playwright **1.48**; the repo's 1.61.1 supports it. Lets the test impersonate the WS server (send envelopes, force close to test reconnect). |
| jsdom `26.1.0` | Vitest `3.2.7` | jsdom provides **no** `WebSocket` global — you must stub it in unit/store tests (`vi.stubGlobal('WebSocket', FakeWebSocket)`). Expected and simple. |

## Sources

- npm registry (live query 2026-07-18) — `@vueuse/core@14.3.0` (latest), `reconnecting-websocket@4.4.0` (last modified 2022-06, unmaintained), `partysocket@1.3.0` (maintained), `@playwright/test@1.61.1` — HIGH confidence.
- vueuse.org/core/useWebSocket (official docs, v14.3.0) — verified `status`/`data`/`send`/`open`/`close`, `onConnected`/`onMessage`/`onDisconnected` callbacks, `autoReconnect` with functional `delay` (exponential backoff), `heartbeat`, `immediate`/`autoConnect`, scope-dispose cleanup — HIGH confidence.
- playwright.dev/docs (Mock browser APIs + network/WebSocket) — verified `page.routeWebSocket()` availability (since 1.48) and `page.addInitScript` fallback pattern for global mocking — HIGH confidence.
- Repo `package.json` — confirmed actual installed versions (Vite 6.4.3, Vitest 3.2.7, Playwright 1.61.1, no VueUse yet) which supersede the dated `codebase/STACK.md` figures — HIGH confidence.

---
*Stack research for: read-only WebSocket realtime channel (Vue 3 + Pinia + Vite)*
*Researched: 2026-07-18*
