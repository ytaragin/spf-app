---
phase: 08-event-dispatch-glue
reviewed: 2026-08-28T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/game/gameEventDispatch.js
  - src/game/gameEventDispatch.test.js
  - src/stores/gameStore.js
  - src/stores/gameStore.test.js
findings:
  critical: 1
  warning: 8
  info: 6
  total: 15
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-08-28
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The dispatch module is genuinely pure — zero imports, no `async`, store injected as a
parameter, and every write routed through an `apply*` local-apply action rather than a
POSTing `set*` sibling. Envelope and payload validation is present on all five branches
and logs without leaking payload values. Lint is clean on all four files.

The defects cluster in three places: (1) the newly-added optimistic write in
`setPlayType` is an unguarded last-writer-wins race against concurrent WebSocket
`NextPlayTypeSet` deliveries; (2) the "all writes go through the gate" invariant is not
actually complete — `fetchAllPlayResults` still replaces `playResults` wholesale and
calls the reducer directly, and the two lineup variants have no ordering gate at all;
(3) several tests are structurally vacuous — a tautological "covers exactly 5 variants"
assertion, and negative-path tests whose names promise "logs once" while dispatching
twice and never asserting a call count.

## Critical Issues

### CR-01: `setPlayType` optimistic write clobbers newer WebSocket state (stale write)

**File:** `src/stores/gameStore.js:381-403` (write at `:392`)
**Issue:** `applyNextPlayType(playType)` runs *after* `await axios.post(...)` resolves,
using the argument captured at call time. `nextPlayType` has **no ordering gate** — no
`play_counter`, no sequence, no in-flight token — unlike `gameState`, which the whole
phase was built to protect. Two concrete failures:

1. **WS race.** User picks `Run` → POST in flight → server broadcasts
   `NextPlayTypeSet: 'Pass'` (e.g. a rule forced a change, or the other client set it)
   → dispatch applies `Pass` → the POST then resolves and the optimistic write stamps
   `Run` back over it. The UI now shows a play type the server does not have.
2. **Concurrent REST race.** `fetchGameData` → `fetchPlayTypes` calls
   `applyNextPlayType(response.data.next_type)`. Interleaved with a slower `setPlayType`
   POST, the optimistic write again wins and discards the authoritative value.

The trailing position of the write makes this strictly worse than writing optimistically
*before* the POST: it maximizes the window in which a newer value can be overwritten.

**Fix:** Guard the write with a monotonic token so only the newest intent may land, and
prefer the server echo when one exists.

```js
// module scope inside the setup store
const playTypeWriteSeq = ref(0)

async function setPlayType(playType) {
  const url = `${baseUrl}/game/nexttype`
  const seq = ++playTypeWriteSeq.value
  try {
    const response = await axios.post(url, playType, {
      headers: { 'Content-Type': 'text/plain' }
    })
    gameMsg.value = response.data || 'Play type set successfully'
    // Drop the optimistic write if anything newer (WS event or a later
    // setPlayType) has landed while this POST was in flight.
    if (seq === playTypeWriteSeq.value) {
      applyNextPlayType(playType)
    }
  } catch (err) {
    // ...unchanged
  }
}
```

and bump `playTypeWriteSeq.value++` inside `applyNextPlayType` so WS/REST applies also
invalidate in-flight optimistic writes.

## Warnings

### WR-01: `fetchAllPlayResults` still bypasses the gated apply path

**File:** `src/stores/gameStore.js:352-363`
**Issue:** The phase converted `fetchGame`, `fetchPlayResult`, `setLineup`, `getLineup`,
and `fetchPlayTypes` onto `apply*` actions, but `fetchAllPlayResults` was left behind. It
does `playResults.value = response.data || []` — a raw, ungated wholesale replacement —
and then calls `updateGameStateFromPlayResult(mostRecentPlay)` directly instead of
`applyPlayResult`. Consequences: a full sync that races a WS `PlayRun` can *shrink*
`playResults` back to the server snapshot, discarding a newer play already applied; and
because it skips `applyPlayResult`, the `lineupSubmitted` reset is inconsistent with
every other play-apply site. This is the one remaining reducer bypass and it defeats the
phase invariant.

**Fix:** Route through the gate and let the reducer decide:

```js
async function fetchAllPlayResults() {
  const url = `${baseUrl}/game/plays?result=true`
  const response = await axios.get(url)
  const incoming = Array.isArray(response.data) ? response.data : []
  // Replay through the single gated path so out-of-order/duplicate plays
  // already applied by the WS path are rejected rather than regressing state.
  for (const play of incoming) {
    applyPlayResult(play)
  }
}
```

### WR-02: Array payloads pass the object guard and are stored as lineups

**File:** `src/game/gameEventDispatch.js:24-26, 94-117`
**Issue:** `isPayloadObject` is `value !== null && typeof value === 'object'`, and
`typeof [] === 'object'`. So `{ event: 'OffensiveLineupSet', data: [] }` passes
validation, reaches `store.applyLineup('offense', [])`, silently overwrites a valid
lineup with an array, and `dispatchEvent` returns `true` claiming success. `getPlayer`
then quietly resolves every position to `''`. The `GameStarted` case is saved only
downstream by the reducer's `play_counter` check — not by this guard.

**Fix:**

```js
function isPayloadObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
```

and apply the same `!Array.isArray(...)` check to the inline `PlayRun` `data` /
`data.new_state` guards at `:62` and `:70`, which use the raw `typeof` test rather than
this helper.

### WR-03: Lineup variants have no ordering gate and return an unearned `true`

**File:** `src/game/gameEventDispatch.js:103-104, 115-116`
**Issue:** `dispatchEvent`'s contract (`:39-41`) is "`true` when a store mutation was
actually performed, `false` when the event was ignored (… or reducer no-op)". The two
lineup branches return a hardcoded `true` because `applyLineup` returns nothing and
applies no gate — it is pure last-writer-wins (`gameStore.js:88-90`). A stale
`OffensiveLineupSet` re-delivered after a newer one (WebSocket reconnect replay, or a
resync racing a live event) silently regresses the lineup and reports success. Every
other variant derives its verdict from the reducer; these two are exempt from the
phase's own ordering guarantee.

**Fix:** Carry the ordering key. Either have the server include `play_counter` in the
lineup payload and gate `applyLineup` on it, or track a per-side applied counter:

```js
function applyLineup(side, lineup, counter) {
  const seen = lineupCounters.value[side]
  if (Number.isFinite(counter) && Number.isFinite(seen) && counter <= seen) return false
  if (Number.isFinite(counter)) lineupCounters.value[side] = counter
  lineups.value[side] = lineup
  return true
}
```

then `return store.applyLineup('offense', data, data.play_counter) === true`. If gating
is genuinely out of scope for this phase, at minimum record it as an accepted gap in the
module header instead of leaving the return value asserting a guarantee it does not have.

### WR-04: `dispatchEvent` can throw despite the "Never throws" contract

**File:** `src/game/gameEventDispatch.js:9-10, 77, 91, 103, 115, 130`
**Issue:** The header states "Never throws — malformed envelopes and unusable payloads
are logged … and ignored." The envelope is validated exhaustively; the **injected store
is not validated at all**. `dispatchEvent(undefined, { event: 'PlayRun', data })` or a
store missing `applyPlayResult` throws a `TypeError` straight out of the dispatcher. In a
WebSocket message handler an uncaught throw can kill the socket's message pump — exactly
the failure mode the phase set out to prevent. No test covers a malformed store; the
negative-path suites all pass a fully-populated fake.

**Fix:** Validate the one dependency the module actually consumes, at the top:

```js
if (store === null || typeof store !== 'object') {
  console.error(`dispatchEvent: ignoring envelope — store is not an object (received ${typeof store})`)
  return false
}
```

and before each call site, e.g.:

```js
if (typeof store.applyPlayResult !== 'function') {
  console.error(`dispatchEvent: ignoring ${tag} — store.applyPlayResult is not a function`)
  return false
}
```

Add a test asserting `dispatchEvent(null, valid)` and `dispatchEvent({}, valid)` return
`false` without throwing.

### WR-05: `setLineup` applies the request body, not the server echo

**File:** `src/stores/gameStore.js:98-100`
**Issue:** `applyLineup(func, lineup)` stores the client's own submitted object. Its
sibling `getLineup` (`:155`) stores `response.data` — the authoritative shape. If the
server normalizes, fills defaults, rejects individual assignments, or returns a canonical
lineup, local state silently diverges from the server until the next full refresh.
Divergent semantics between two callers of the same "single write site" undercuts the
point of extracting it.

**Fix:** Prefer the echo when the endpoint returns a lineup object:

```js
const response = await axios.post(url, lineup)
gameMsg.value = response.data
// Prefer the server's canonical lineup; fall back to the submitted one when
// the endpoint replies with a bare status string.
const echoed = response.data
applyLineup(func, echoed !== null && typeof echoed === 'object' ? echoed : lineup)
```

If the endpoint is known to return only a status string, say so in a comment so the
asymmetry with `getLineup` is deliberate rather than accidental.

### WR-06: Negative-path tests dispatch twice and never assert the "once" they promise

**File:** `src/game/gameEventDispatch.test.js:78-85, 111-117, 199-206`
**Issue:** These tests are titled "returns false, **logs once**, and touches no store
action" / "false, **one log**, zero store calls", but they call `dispatchEvent` twice —
once inside `expect(...).not.toThrow()` and again for the return value — and then assert
only `expect(spy).toHaveBeenCalled()`, which is satisfied by any call count ≥ 1. The
"once" claim is never tested and *cannot* hold, since two dispatches log twice. A
regression that logs three times per event would pass. The doubled dispatch also weakens
`expect(store.calls).toHaveLength(0)` into an assertion about two invocations rather than
the one described.

**Fix:** Dispatch once, capture the result, and assert the count:

```js
const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
const store = makeFakeStore()
let result
expect(() => {
  result = dispatchEvent(store, { event: 'PlayRun', data })
}).not.toThrow()
expect(result).toBe(false)
expect(spy).toHaveBeenCalledTimes(1)
expect(store.calls).toHaveLength(0)
```

### WR-07: The "covers exactly the 5 known variants" test is a tautology

**File:** `src/game/gameEventDispatch.test.js:283-293`
**Issue:** `variants` is a local array literal declared eight lines above; asserting
`expect(variants).toHaveLength(5)` compares the file against itself and can never fail.
The comment claims "The two lists must stay in lockstep — this test is what makes drift
visible," but `KNOWN_VARIANTS` from `gameEvents.js` is never imported, so drift is
precisely what this test cannot detect. Adding a sixth variant in `gameEvents.js` without
a dispatch branch leaves the whole suite green — the exact scenario the module header at
`gameEventDispatch.js:12-15` warns about.

**Fix:** Anchor the assertion to the real source of truth:

```js
import { KNOWN_VARIANTS } from '@/game/gameEvents.js'

it('exercises every tag declared in KNOWN_VARIANTS', () => {
  expect(variants.map(([event]) => event).sort()).toEqual([...KNOWN_VARIANTS].sort())
})
```

### WR-08: No test covers the failure or race behavior of the new optimistic write

**File:** `src/stores/gameStore.test.js:93-98, 489-506`
**Issue:** The only coverage of the phase's riskiest new line (CR-01) is a single
happy-path assertion. Missing: (a) that a rejected POST leaves `nextPlayType` *unchanged*
rather than optimistically applied — the error-branch tests at `:489-506` assert only
`gameMsg`/`error` and never inspect `getNextPlayType`; (b) any interleaving test proving a
value applied while the POST was in flight survives. The untested branch is the one where
the bug lives.

**Fix:** Add both:

```js
it('does not apply the play type locally when the POST fails', async () => {
  axios.post.mockRejectedValueOnce({ response: { data: 'type bad' } })
  const store = useGameStore()
  store.applyNextPlayType('Run')
  await store.setPlayType('Pass')
  expect(store.getNextPlayType).toBe('Run')
})

it('does not clobber a play type applied while the POST was in flight', async () => {
  let resolvePost
  axios.post.mockReturnValueOnce(new Promise((r) => (resolvePost = r)))
  const store = useGameStore()
  const pending = store.setPlayType('Run')
  store.applyNextPlayType('Pass') // WS NextPlayTypeSet lands mid-flight
  resolvePost({ data: 'type set' })
  await pending
  expect(store.getNextPlayType).toBe('Pass')
})
```

The second test fails against the current implementation — that is the point.

## Info

### IN-01: Section comment mangled onto a member line in the public surface

**File:** `src/stores/gameStore.js:482`
**Issue:** `applyNextPlayType, // Hover state and functions` — the pre-existing
`// Hover state and functions` banner was absorbed onto the last new member's line
instead of being left on its own line above `hoveredBox`. It now reads as a comment about
`applyNextPlayType`, which is the opposite of its meaning, and breaks the otherwise
consistent banner style of the returned surface.

**Fix:**

```js
    applyNextPlayType,
    // Hover state and functions
    hoveredBox,
```

### IN-02: `NextPlayTypeSet` normalization is implemented twice, with different rules

**File:** `src/game/gameEventDispatch.js:120-126` and `src/stores/gameStore.js:184-192`
**Issue:** The comment at `:128-129` says the store "owns the single implementation of the
string / `{ next_type }` normalization (D-10)", yet the dispatcher re-implements the same
shape check to decide accept/reject. The two already disagree at the edges: dispatch
rejects `{ next_type: '' }` outright, while `applyNextPlayType` would accept it and
normalize to `null`. Two copies of one rule will drift.

**Fix:** Have `applyNextPlayType` return whether it stored a non-null value and let the
dispatcher forward that verdict, deleting the duplicated guard:
`return store.applyNextPlayType(data) === true`.

### IN-03: `isPayloadObject` JSDoc is inaccurate

**File:** `src/game/gameEventDispatch.js:19-23`
**Issue:** "non-null, not an array-free primitive" is not parseable and describes
behavior the function does not have — arrays are accepted (see WR-02), and "array-free
primitive" is not a thing.

**Fix:** After applying WR-02: "True when `value` is a usable payload object: non-null,
`typeof 'object'`, and not an array."

### IN-04: `makeFakeStore` override writes to a shadow array, leaving assertions ambiguous

**File:** `src/game/gameEventDispatch.test.js:47-57`
**Issue:** The override closes over a locally declared `calls` array while the returned
store still exposes its own empty `store.calls`. Two same-named arrays with different
contents in one test invites a future reader to assert against the wrong one; the test
also never checks `store.calls`, so the fake's default bookkeeping is dead here.

**Fix:** Use `vi.fn(() => false)` and assert with `toHaveBeenCalledTimes(1)`, or have
`makeFakeStore` accept a return-value map so overrides keep recording into `store.calls`.

### IN-05: Weak rejection assertion in the `runPlay` network-error test

**File:** `src/stores/gameStore.test.js:544`
**Issue:** `rejects.toBeTruthy()` passes for literally any thrown non-falsy value,
including one unrelated to the network path. The test cannot distinguish a re-thrown
axios error from an incidental `TypeError`.

**Fix:** `await expect(store.runPlay()).rejects.toMatchObject({ message: 'network down' })`

### IN-06: Duplicate/stale-path store tests emit unmocked `console.error` noise

**File:** `src/stores/gameStore.test.js:155-209, 211-248, 321-379`
**Issue:** Every rejected apply makes `applyGameState` log via `console.error`
(`gameStateReducer.js:47,55`). Unlike the dispatch suite, these blocks never spy on
`console.error`, so expected-rejection runs print reducer errors into the test output —
noise that trains readers to ignore real failures. It also means no test asserts the
reducer *does* log on rejection.

**Fix:** Add a `beforeEach` spy (`vi.spyOn(console, 'error').mockImplementation(() => {})`)
in these describes and assert `toHaveBeenCalled()` in at least one rejection case.

---

_Reviewed: 2026-08-28_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
