# Pitfalls Research

**Domain:** Adding a read-only WebSocket realtime channel alongside existing REST optimistic updates (Vue 3 + Pinia setup-store, backend-authoritative)
**Researched:** 2026-07-18
**Confidence:** HIGH (codebase-specific findings verified directly against `src/stores/gameStore.js`; WS/Vue/Pinia patterns are well-established engineering knowledge — MEDIUM-HIGH)

> **Read this first — the actual code contradicts a milestone assumption.**
> The v1.1 decision says "REST keeps optimistic apply AND WS also applies, relying on idempotency; NO play_counter guard chosen." But the current code (`gameStore.js`) does **not** optimistically apply state on `runPlay()` — `runPlay()` only sets `gameMsg` (lines 240–266). State is applied wholesale by `updateGameStateFromPlayResult()` via `gameState.value = { ...new_state }` (line 353), and `fetchPlayResult()` **already contains a `play_counter` monotonic guard** (lines 273–288) for the `playResults` array. So the real system already has ordering machinery — but only on one path, and the WS path will bypass it. This mismatch is the single biggest risk surface; several pitfalls below derive from it.

## Critical Pitfalls

### Pitfall 1: "Idempotency" is assumed but the apply is a full-object replace with no ordering — an OLD event overwrites NEWER state

**What goes wrong:**
The milestone treats "re-applying the same state is a no-op" as the sole safeguard. That's true only if events always carry the *latest* state and always arrive in order. Neither holds on a real socket. `updateGameStateFromPlayResult` does `gameState.value = { ...new_state }` — a blind overwrite. If a delayed/duplicated `PlayRun` carrying play_counter=41 arrives *after* the REST result (or a newer WS event) already advanced to 42, the UI regresses to the previous play: score drops, down/possession jump backward, then (maybe) snap forward. Idempotency prevents duplicate-*identical* payloads from doing harm; it does **nothing** against stale-but-different payloads. This is a convergence problem, not a de-dupe problem.

**Why it happens:**
"Idempotent" gets conflated with "safe to apply in any order." Re-applying the *same* state is idempotent; applying an *older* state is a regression. With a wholesale `{ ...new_state }` replace, last-writer-wins — and the network decides who writes last.

**How to avoid:**
Make state application **monotonic/convergent**, not just idempotent. Every state-bearing payload (`GameState`, `PlayAndState`) carries `play_counter`; apply only if `incoming.play_counter >= current.play_counter` (`>=` keeps true idempotency for equal counters; `>` for strict advance). Centralize this in a single `applyGameState(newState)` guard so REST and WS share the exact same monotonic gate — do not let WS write `gameState` directly. Note the codebase already has this pattern half-built in `fetchPlayResult` (lines 274–288); generalize it into one reducer both paths call. This is the concrete fix for "idempotency is the ONLY safeguard": a version-guarded reducer turns "idempotent" into "convergent" for free.

**Warning signs:**
Score/down/possession briefly flip to a previous value then correct themselves; flicker that only appears under slow/lossy networks; test that fires two `PlayRun` events out of order and sees final state == the older one.

**Phase to address:** State-application/reducer phase (the phase that wires WS events into Pinia) — before any multi-event handling.

---

### Pitfall 2: Double-application flicker — REST result and WS `PlayRun` both apply, but not byte-identical

**What goes wrong:**
The user runs a play. REST `/game/play` completes and (via `fetchPlayResult`) applies `new_state`. Milliseconds later the server's WS `PlayRun` broadcast for the *same* play applies its `GameState`. If the two payloads differ even slightly (field ordering, a nullable field, `first_down_target` computed vs echoed, a timestamp, floats), the wholesale replace re-renders and the UI flickers/reflows twice for one logical event. Idempotency was supposed to make the second apply a no-op — but only literal equality makes it a no-op, and REST `/play` is a *subset* of `PlayRun` (per the milestone, PlayRun is a superset carrying resulting GameState that REST /play does not), so the shapes are guaranteed to differ.

**Why it happens:**
Two independent inbound channels for the same event, plus wholesale `{ ...obj }` replace that always triggers reactivity even when the meaningful fields are equal. Vue re-renders on reference change regardless of deep equality.

**How to avoid:**
Route both channels through the single `applyGameState` reducer (Pitfall 1) and short-circuit when the *canonical* subset is unchanged: compare `play_counter` first; if equal, skip the assignment entirely (no new reference → no re-render → no flicker). Do not diff whole objects; diff on `play_counter` (authoritative version). Optionally normalize to a canonical shape before storing so REST-subset and WS-superset converge to the same object.

**Warning signs:**
Two render passes / two `PlayResult` animations for one play; `gameState` reference changes twice in devtools per play; flicker only on your own actions (not opponent's).

**Phase to address:** State-application/reducer phase.

---

### Pitfall 3: Reconnect resync (`GET /state`) races in-flight / buffered WS events

**What goes wrong:**
On reconnect the client fires `GET /state` to resync. Meanwhile the freshly-reopened socket immediately starts delivering live events (and possibly a backlog). Classic orderings that corrupt state:
- `GET /state` returns play_counter=40 (a snapshot from when the request was issued), but the socket already delivered play_counter=42; the late-arriving `/state` HTTP response overwrites 42 back to 40.
- Events arrive *during* the `GET /state` round-trip and get applied, then `/state` clobbers them.

Without a version guard, the resync — the thing meant to *fix* drift — becomes the thing that *causes* drift.

**Why it happens:**
Resync is modeled as "just call the REST fetch," ignoring that HTTP snapshot latency and the live event stream are concurrent. The `/state` response is a point-in-time snapshot but is applied whenever it lands.

**How to avoid:**
Same monotonic reducer (Pitfall 1) makes resync safe automatically: `/state` is applied through `applyGameState`, so a stale snapshot with a lower `play_counter` is ignored. Additionally: don't gate live events behind the resync; let both flow through the version-guarded reducer. If backend supports it, prefer a resync that returns the current `play_counter` and let the guard reconcile. Do NOT "pause events until resync completes then replay a buffer" unless you also version-guard the buffer — the buffer reorders nothing and just adds complexity.

**Warning signs:**
State snaps backward right after a "reconnecting → live" transition; bugs that only reproduce when you kill/restore the network mid-play; flaky reconnect E2E.

**Phase to address:** Reconnect/resync phase.

---

### Pitfall 4: Socket not closed on route leave / component unmount / HMR → connection & listener leaks

**What goes wrong:**
The socket is opened in a component `onMounted` or in a store action but never closed. Navigating `/game → /` (LandingPage) leaves the socket open; navigating back opens a *second*. During Vite HMR, each hot update re-runs setup and opens another socket while old ones (and their `onmessage` handlers holding closures over Pinia refs) linger. Result: N sockets applying events to one store, multiplied re-renders, duplicated event application (which *defeats* the idempotency assumption because now multiple live payloads race), and dev-mode memory growth until the tab is reloaded.

**Why it happens:**
WebSocket lifecycle isn't tied to a Vue lifecycle. Pinia stores are singletons that outlive components, so a socket opened "in the store" has no natural teardown point. HMR specifically re-executes module top-level and `setup()` without disposing prior sockets.

**How to avoid:**
- Own the socket in the store but expose explicit `connect(gameId)` / `disconnect()`; make `connect` idempotent (if a live socket exists, no-op or close-then-reopen). Never open a socket at module top-level.
- Tie lifecycle to the game route: `connect` on `GameView` mount, `disconnect` on unmount / `onBeforeRouteLeave`.
- Guard against HMR: `if (import.meta.hot) import.meta.hot.dispose(() => store.disconnect())`.
- On `disconnect`, remove listeners AND `socket.close()`; null out the reference so `connect` can't double-open.

**Warning signs:**
`chrome://inspect` or DevTools Network shows multiple open WS frames; event handlers fire 2×/3× after several HMR saves; "works after full reload, breaks after hot-edit"; growing memory in a long dev session.

**Phase to address:** WS client/lifecycle phase (the first WS phase).

---

### Pitfall 5: Reconnect storm — tight/backoff-less reconnect hammers the server (or dev backend)

**What goes wrong:**
Naive auto-reconnect reopens immediately on `onclose`. If the backend is down or rejecting (bad `VITE_API_BASE_URL`, 4xx handshake), the client spins a reconnect loop firing dozens/sec, spamming logs, pinning CPU, and — combined with Pitfall 4 — potentially stacking sockets. On flaky networks, many clients reconnecting in lockstep create a thundering herd.

**Why it happens:**
"Auto-reconnect with backoff" is specced, but backoff is easy to implement wrong: linear instead of exponential, no jitter, no cap, no distinction between "server said go away" (don't retry) and "transient drop" (retry).

**How to avoid:**
Exponential backoff with jitter and a max cap (e.g. 1s → 2s → 4s … cap 30s, ±random). Reset the delay only after a *stably* open connection (open for >N seconds), not on every `onopen` — otherwise a flapping connection resets backoff every cycle. Stop retrying on permanent handshake failures (e.g. 401/403/404). Surface "disconnected — giving up / retry" in the status indicator instead of looping silently forever.

**Warning signs:**
Console flooded with connect/close pairs; backoff delay never grows during an outage; CPU spike when backend is stopped; reconnect count climbs without bound.

**Phase to address:** Reconnect/resync phase.

---

### Pitfall 6: Envelope/type mismatch — tagged WS `{ event, data }` vs bare REST bodies, and snake_case handling

**What goes wrong:**
The WS handler forgets to unwrap the envelope and passes `{ event, data }` where a bare `GameState` is expected (as REST returns), so `applyGameState` reads `undefined` fields and writes garbage/`undefined` into `gameState` — Vuetify then renders blanks or `NaN`. Or the reverse: a `switch(event)` handles `PlayRun` by applying `data` (the full `PlayAndState`) directly to `gameState` instead of `data.new_state`, storing the wrong shape. Because fields are snake_case (`new_state`, `play_counter`, `first_down_target`), a stray camelCase access (`data.newState`) silently returns `undefined` and the monotonic guard (Pitfall 1) then compares `undefined` counters — disabling the guard.

**Why it happens:**
Two payload conventions in one app (tagged vs bare), five event variants with different `data` shapes (`GameState` vs lineup vs play_type vs `PlayAndState`), and snake_case that isn't enforced by any type system (plain JS). Easy to mis-map one variant.

**How to avoid:**
- One thin adapter at the socket boundary: parse JSON, validate `event` is one of the 5 known tags, then `switch` mapping each `event` to the correct extraction (`PlayRun → data.new_state`, `GameStarted → data`, lineup/play_type → their targets). Unknown `event` → log + ignore, never apply.
- Normalize so both channels feed the reducer the same *bare* shape: REST already passes bare `new_state`; WS must unwrap to the same before calling `applyGameState`.
- Keep snake_case end-to-end (matches existing conventions — do NOT rename API fields); assert `play_counter` is a finite number before using it as the guard key (`Number.isFinite`), else treat as "cannot order → skip."
- Add a store unit test per event variant asserting the extracted shape.

**Warning signs:**
Blank/`NaN` fields in the status/score UI after a WS event; guard "works" but never actually skips (because counters are `undefined`); tests pass for REST but component shows nothing when driven by WS.

**Phase to address:** Envelope-parsing / event-dispatch phase (with the reducer phase).

---

### Pitfall 7: Stale closures over Pinia state inside long-lived socket handlers

**What goes wrong:**
The `onmessage` handler is defined once (at connect time) and closes over destructured values or a snapshot rather than live refs. E.g. capturing `const { gameState } = storeToRefs(store)` fine, but capturing a plain `const current = gameState.value` at connect time and comparing against it forever — so the version guard reads a value frozen at connection, not the live one. Or reading `store.$state` copied once. Handlers then make decisions on stale data: the guard passes when it shouldn't, duplicates get applied.

**Why it happens:**
Socket handlers are registered once and live for the whole connection; any value captured by value (not by reference) freezes. Pinia setup-store refs are safe *if* you read `.value` inside the handler each time — but destructuring reactive state into locals, or plain-destructuring the store, breaks reactivity (the codebase conventions already warn: "never plain-destructure reactive state").

**How to avoid:**
Inside handlers, always read fresh: call the store getter / read `ref.value` *at handit time*, never cache the value across messages. Prefer routing every message through a store action (`store.applyEvent(msg)`) so the action reads live `gameState.value` itself — the handler just forwards. Avoid capturing `gameState.value`, `$state`, or destructured reactive fields in the closure.

**Warning signs:**
Guard behaves correctly on the first event after connect but wrong on later ones; behavior differs between "fresh connect" and "after several events"; bugs vanish when you reconnect (re-creating the closure).

**Phase to address:** WS client/dispatch phase.

---

### Pitfall 8: Missed events during disconnect are silently lost (gap not detected)

**What goes wrong:**
While disconnected, the opponent runs 3 plays. On reconnect, resync `GET /state` gives the *latest* snapshot (play_counter jumps 39 → 43) but the intermediate `playResults` (the per-play history the UI lists) are never fetched — so the play log has holes even though the scoreboard is correct. Users see a score change with no explanation. The milestone's resync is state-only; the play *history* array isn't reconciled.

**Why it happens:**
Resync conflated "current state" with "everything I missed." `GET /state` restores the scoreboard but not the event log. The gap between last-seen `play_counter` and resync `play_counter` is invisible unless checked.

**How to avoid:**
On reconnect, detect the gap: if `resync.play_counter > lastSeen.play_counter + 1`, backfill the history via the existing `fetchAllPlayResults()` (`GET /game/plays?result=true`) or a ranged fetch, then apply through the reducer. The codebase already has `fetchAllPlayResults` and a `fullSync` path in `fetchGameData(true)` — reuse it as the reconnect backfill. At minimum, surface "you may have missed plays" if backfill isn't implemented.

**Warning signs:**
Play-log list has non-contiguous `play_counter`s; scoreboard advances but no new `PlayResult` card appears; only reproducible after a real disconnect (not in happy-path tests).

**Phase to address:** Reconnect/resync phase (reuse existing `fullSync`).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Rely on idempotency alone, skip `play_counter` guard (the milestone decision as written) | Less code in v1.1 | Silent state regressions/flicker under real networks; unfixable without the guard later | **Never** for state-bearing events — the guard is ~5 lines and the code already has it in `fetchPlayResult`. Reuse it. |
| WS writes `gameState.value` directly (bypass a shared reducer) | Fast to wire up | REST and WS drift apart; two code paths to keep monotonic; double-apply flicker | Never — always funnel both through one `applyGameState` |
| Open socket in a component `onMounted` without teardown | Quick demo | Leaks on route change + HMR (Pitfall 4) | Only in a throwaway spike, never merged |
| No exponential backoff / jitter | Simpler reconnect | Reconnect storms, thundering herd | Never for production; a fixed short delay is only OK behind a manual "reconnect" button |
| State-only resync (skip history backfill) | Simpler reconnect | Gaps in play log after disconnect | Acceptable for v1.1 IF a "missed plays — refresh" affordance is shown; otherwise backfill |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WS URL from `VITE_API_BASE_URL` | Hardcoding `ws://` or string-concatenating; breaks under HTTPS | Derive scheme from page: `https:` → `wss:`, else `ws:`; replace protocol on the existing base URL, don't rebuild |
| Tagged WS vs bare REST | Applying `{event,data}` where bare `GameState` expected | Unwrap in one adapter; per-variant extraction; both channels feed reducer the same bare shape |
| `PlayRun` superset vs REST `/play` subset | Storing whole `PlayAndState` into `gameState` | Extract `data.new_state`; keep result-vs-state separation matching REST path |
| Pinia singleton + socket | Socket outlives components, no teardown | `connect`/`disconnect` actions; lifecycle tied to `GameView` + HMR dispose |
| snake_case fields | camelCase access returns `undefined`, disables guard | Keep snake_case per project conventions; `Number.isFinite(play_counter)` before ordering |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Wholesale `{ ...new_state }` replace on every event | Full re-render per event even when unchanged | Version-guard: skip assignment when `play_counter` unchanged | Immediately, on any duplicate/superset event |
| Unbounded `playResults` growth from WS + REST both pushing | Memory/DOM grows; duplicate cards | De-dupe pushes by `play_counter` (guard already in `fetchPlayResult`); apply same to WS path | Long games / many plays |
| Reconnect storm | CPU spike, log flood when backend down | Exponential backoff + jitter + cap + give-up | Any backend outage or bad env URL |
| Stacked sockets from leaks | Event handlers fire N× | Idempotent `connect`, teardown on unmount/HMR | After a few route changes / HMR saves |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `ws://` under an HTTPS page | Mixed-content block (browser refuses); or plaintext game data on the wire | Derive `wss:` from page protocol; never hardcode `ws:` |
| No origin/auth on the socket | Any origin can open the read-only feed; opponent's state leaks cross-tab/site | Ensure handshake carries same auth as REST (cookie/session or token in query — noting browsers can't set WS headers); validate server-side origin. (Read-only limits blast radius but doesn't make it public.) |
| Trusting WS payload shape blindly | Malformed/hostile frame writes `undefined`/garbage into state | Validate `event` ∈ known 5 tags and required fields before apply; unknown → ignore |
| Logging full frames to console in prod | Leaks game/session data | Gate verbose WS logging behind `import.meta.env.DEV` (pattern already used in `GameLayout.vue`) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No connection-status indicator (or only binary) | User can't tell if UI is live or frozen | Three states as specced: live / reconnecting / disconnected; make "reconnecting" visible, not silent |
| State flicker on own actions | Feels buggy/janky | Version guard so own REST apply + WS echo don't double-render |
| Silent state jumps after reconnect | Confusing score/possession changes with no context | Backfill play log or show "caught up — X plays occurred" |
| "Reconnecting" spinner forever after give-up | User waits indefinitely | On give-up, switch to "disconnected — Reconnect" button |

## "Looks Done But Isn't" Checklist

- [ ] **Idempotent apply:** Often missing the ordering guard — verify an *older* `play_counter` event does NOT overwrite newer state (not just that duplicates are no-ops).
- [ ] **Reconnect resync:** Often missing the race guard — verify a stale `GET /state` snapshot arriving after live events does not regress state.
- [ ] **Socket teardown:** Often missing — verify only ONE open WS after `/game → / → /game` and after 3 HMR saves.
- [ ] **Backoff:** Often missing jitter/cap/give-up — verify delay grows and stops when backend is down.
- [ ] **Envelope unwrap:** Often missing per-variant mapping — verify each of the 5 events applies the correct field (`PlayRun → new_state`).
- [ ] **wss under HTTPS:** Often missing scheme derivation — verify no hardcoded `ws://`.
- [ ] **History gap:** Often missing — verify play log is contiguous after a disconnect spanning multiple plays.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| No version guard shipped, flicker/regressions reported | LOW | Add `play_counter` guard to the single reducer; already prototyped in `fetchPlayResult` — generalize it |
| Direct WS→gameState writes scattered | MEDIUM | Refactor all writers through `applyGameState`; add test per channel |
| Socket leaks in prod | LOW–MEDIUM | Add `disconnect()` on unmount + HMR dispose; make `connect` idempotent |
| Reconnect storm in prod | LOW | Wrap reconnect in exponential backoff + jitter + cap + give-up |
| History gaps | MEDIUM | Add gap detection + `fetchAllPlayResults` backfill on reconnect |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Idempotency-only / no ordering | Reducer/state-apply phase | Unit test: out-of-order events converge to newest |
| 2. Double-apply flicker | Reducer/state-apply phase | Test: same-counter event causes no new `gameState` reference |
| 3. Reconnect/resync race | Reconnect phase | Test: stale `/state` snapshot ignored vs live events |
| 4. Connection leaks | WS client/lifecycle phase | Test/manual: single socket after route churn + HMR |
| 5. Reconnect storm | Reconnect phase | Test: backoff grows, jitter present, give-up fires |
| 6. Envelope/type mismatch | Event-dispatch phase | Test per variant: correct field extracted; unknown ignored |
| 7. Stale closures | WS client/dispatch phase | Test: guard correct on 2nd+ event after connect |
| 8. Missed-events gap | Reconnect phase | Test: contiguous play log after multi-play disconnect |

**Recommended phase ordering implication:** WS client/lifecycle (connect/disconnect/leaks) → envelope parsing/dispatch → **single monotonic reducer** (do this before enabling live apply) → reconnect/resync/backfill → status UI → tests (mocked socket + Playwright mock WS). The reducer is the keystone: build it before the WS path is allowed to write state, so idempotency becomes convergence from day one.

## Sources

- Direct code review: `src/stores/gameStore.js` (existing `play_counter` guard lines 273–288; wholesale replace line 353; `runPlay` does not optimistically apply, lines 240–266) — HIGH confidence.
- Project context: `.planning/PROJECT.md` (v1.1 Realtime milestone, key decisions) — HIGH.
- Established WebSocket + SPA engineering patterns (monotonic/version-guarded apply, exponential backoff with jitter, lifecycle teardown, HMR dispose, wss scheme derivation, stale-closure hazards in long-lived handlers) — MEDIUM-HIGH (widely documented; no external search provider configured this run, cross-checked against actual code).

---
*Pitfalls research for: WebSocket realtime channel added to REST-optimistic Vue 3 + Pinia app*
*Researched: 2026-07-18*
