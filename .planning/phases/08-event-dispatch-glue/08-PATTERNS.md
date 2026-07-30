# Phase 8: Event Dispatch Glue - Pattern Map

**Mapped:** 2026-07-30
**Files analyzed:** 4 (2 new, 2 modified)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/game/gameEventDispatch.js` (NEW) | domain utility (pure router) | event-driven | `src/game/gameEvents.js` | exact (same layer, same event-driven flow, same never-throw posture) |
| `src/game/gameEventDispatch.test.js` (NEW) | test | event-driven | `src/game/gameEvents.test.js` | exact |
| `src/stores/gameStore.js` (MODIFIED) | store (Pinia setup-store) | request-response + local apply | itself — `fetchGame` / `updateGameStateFromPlayResult` are the in-file precedents | exact (self-analog) |
| `src/stores/gameStore.test.js` (MODIFIED) | test | request-response | itself — existing `fetchPlayResult` describe block | exact (self-analog) |

**Prettier facts (apply to every file below):** no semicolons, single quotes, 2-space indent, 100-col print width, no trailing commas. Source: `.prettierrc.json`.

---

## Pattern Assignments

### `src/game/gameEventDispatch.js` (domain utility, event-driven)

**Analog:** `src/game/gameEvents.js` (56 lines — the sibling Phase 6 module, same directory, same contract style)

**Module header JSDoc pattern** (`gameEvents.js` lines 1-9) — copy this shape, changing only the subject:
```javascript
/**
 * WebSocket game-event envelope validation.
 *
 * Pure — no Vue/store access; validates the tagged `{ event, data }` envelope
 * shape only. Callers pass an already-parsed object (never a raw JSON string):
 * this module does not deserialize. Never throws — malformed or unknown-variant
 * envelopes resolve to `null` so callers can use the defensive-null / ignore
 * pattern.
 */
```
Note: **zero imports** in `gameEvents.js`. `gameEventDispatch.js` must likewise import nothing from the app layer (D-01) — no `useGameStore`, no axios, no vue.

**Canonical variant list** (`gameEvents.js` lines 11-17) — dispatch branch coverage must match this set exactly (5 branches, no more, no less):
```javascript
const KNOWN_VARIANTS = new Set([
  'GameStarted',
  'OffensiveLineupSet',
  'DefensiveLineupSet',
  'NextPlayTypeSet',
  'PlayRun'
])
```

**Exported-function JSDoc pattern** (`gameEvents.js` lines 19-32) — prose contract paragraph, then `@param`/`@returns`:
```javascript
/**
 * Validate and unwrap a tagged WebSocket event envelope.
 *
 * Accepts an already-parsed object (does NOT deserialize). On a valid known
 * variant, returns the envelope pass-through unchanged as `{ event, data }`
 * ...
 * @param {object} raw  an already-parsed envelope object
 * @returns {{ event: string, data: * }|null}
 */
```

**Guard-clause + early-return structure** (`gameEvents.js` lines 33-55) — the exact shape each `dispatchEvent` variant handler should take (validate, log, return the reject value; no `else`, no throw):
```javascript
export function parseEvent(raw) {
  if (raw === null || typeof raw !== 'object') {
    console.error(`Rejecting WS event: input is not an object (received ${typeof raw})`)
    return null
  }

  const event = raw.event
  if (typeof event !== 'string') {
    console.error(`Rejecting WS event: missing or non-string event tag (received ${typeof event})`)
    return null
  }

  if (!('data' in raw)) {
    console.error(`Rejecting WS event: missing data for event tag ${event}`)
    return null
  }

  if (!KNOWN_VARIANTS.has(event)) {
    console.error(`Rejecting WS event: unknown event tag ${event}`)
    return null
  }

  return { event, data: raw.data }
}
```

**EXACT `console.error` rejection style to copy (D-04 / D-08):**
- Leading context phrase, then a colon, then the specific reason: `` `Rejecting WS event: unknown event tag ${event}` ``
- Interpolates **only** the event tag and/or a `typeof` — **never** the payload or a `JSON.stringify` of `data`. (`gameEvents.test.js` lines 46-51 assert this: the log must not contain a payload value.)
- Uses a template literal even when the string is otherwise static-ish.
- Single argument to `console.error` (not `console.error(msg, obj)`).
- For a dispatch module, prefix with the module's own subject per `gameStateReducer.js` style: `` `applyGameState: rejected incoming state — ...` ``. Recommended dispatch prefix: `dispatchEvent: ...`, e.g. `` `dispatchEvent: ignoring PlayRun — missing data.new_state` ``.

**Private helper pattern** (`gameStateReducer.js` lines 18-26) — non-exported helper above the export, defensive optional chaining, no throw:
```javascript
function isNewer(current, incoming) {
  const incomingCounter = incoming?.play_counter
  if (!Number.isFinite(incomingCounter)) return false

  const currentCounter = current?.play_counter
  const currentBaseline = Number.isFinite(currentCounter) ? currentCounter : -Infinity

  return incomingCounter > currentBaseline
}
```

---

### `src/game/gameEventDispatch.test.js` (test, event-driven)

**Analog:** `src/game/gameEvents.test.js` (73 lines)

**Imports + spy hygiene** (lines 1-6) — note `@` alias with explicit `.js` extension:
```javascript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseEvent } from '@/game/gameEvents.js'

afterEach(() => {
  vi.restoreAllMocks()
})
```
(`gameStateReducer.test.js` instead uses a per-test `const spy = vi.spyOn(...); ...; spy.mockRestore()`. Either is established; the `afterEach(restoreAllMocks)` form is cleaner for a file with many logging assertions.)

**console.error assertion pattern** (`gameEvents.test.js` lines 37-51) — this is the template for every D-08 "loud rejection" test:
```javascript
it('returns null and logs via console.error including the offending tag', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(parseEvent({ event: 'Nope', data: {} })).toBeNull()
  expect(spy).toHaveBeenCalled()
  const message = spy.mock.calls[0].join(' ')
  expect(message).toContain('Nope')
})

it('does not dump the full stringified payload in the log', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  parseEvent({ event: 'Nope', data: { secret: 'top-secret-value' } })
  const message = spy.mock.calls[0].join(' ')
  expect(message).not.toContain('top-secret-value')
})
```

**Table-driven per-variant / malformed cases** (`gameEvents.test.js` lines 54-72) — the exact pattern for covering all 5 variants and the malformed matrix:
```javascript
const cases = [
  ['null', null],
  ['undefined', undefined],
  ['a number', 42],
  ['a string', 'string'],
  ['missing event', {}],
  ['non-string event', { event: 123, data: {} }],
  ['missing data', { event: 'PlayRun' }]
]

for (const [label, input] of cases) {
  it(`returns null and never throws for ${label}`, () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => parseEvent(input)).not.toThrow()
    expect(parseEvent(input)).toBeNull()
  })
}
```

**Loop-over-all-5-variants pattern** (`gameEvents.test.js` lines 23-34):
```javascript
it('accepts each of the 5 known variants', () => {
  const variants = [
    'GameStarted',
    'OffensiveLineupSet',
    'DefensiveLineupSet',
    'NextPlayTypeSet',
    'PlayRun'
  ]
  for (const event of variants) {
    expect(parseEvent({ event, data: {} })).toEqual({ event, data: {} })
  }
})
```

**Never-throws assertion idiom** (`gameStateReducer.test.js` lines 31-40) — assert `not.toThrow()` *and* the return value, plus `expect(spy).toHaveBeenCalled()`:
```javascript
it('rejects an undefined play_counter, logging via console.error, never throwing', () => {
  const current = { play_counter: 3 }
  const incoming = { play_counter: undefined }
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => applyGameState(current, incoming)).not.toThrow()
  const result = applyGameState(current, incoming)
  expect(result).toBe(current)
  expect(spy).toHaveBeenCalled()
  spy.mockRestore()
})
```

**Fake store construction (no existing analog — new pattern for this phase).** There is no zero-mock fake-store example in the repo. The nearest precedent is the plain-object fixtures used throughout `gameStateReducer.test.js` (`const current = { play_counter: 3 }`). Recommended shape, consistent with that style — a plain object with recorded call arrays, no `vi.fn()` needed:
```javascript
function makeFakeStore() {
  const calls = []
  return {
    calls,
    applyLineup: (side, lineup) => calls.push(['applyLineup', side, lineup]),
    applyNextPlayType: (type) => calls.push(['applyNextPlayType', type]),
    applyPlayResult: (playAndState) => {
      calls.push(['applyPlayResult', playAndState])
      return true
    },
    applyIncomingGameState: (state) => {
      calls.push(['applyIncomingGameState', state])
      return true
    }
  }
}
```
The "no store touched on reject" assertion (D-08) is then simply `expect(store.calls).toHaveLength(0)`.

**Test factories available** (`test/factories/`): `lineup.js`, `gameState.js`, `players.js`. `src/stores/gameStore.test.js:5` imports as `import { buildLineup } from '../../test/factories/lineup.js'` (relative, not `@`). Use `buildLineup()` for `OffensiveLineupSet` / `DefensiveLineupSet` payloads and the `gameState.js` factory for `GameStarted` / `PlayRun`.

---

### `src/stores/gameStore.js` (store, request-response + local apply) — MODIFIED

**Analog:** itself. `fetchGame` and `updateGameStateFromPlayResult` are the in-file Phase 7 precedents for exactly this refactor.

**Import block** (lines 1-5) — note the store layer uses **relative** paths for `src/game/` modules, not the `@` alias:
```javascript
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from '../game/SPFMetadata.js'
import { applyGameState } from '../game/gameStateReducer.js'
```

**Local-mutation action pattern** (lines 40-46) — the shape every new `apply*` action should follow (plain function, writes `.value`, no async, no try/catch):
```javascript
function clearError() {
  error.value = null
}

function setLineupSubmitted(value) {
  lineupSubmitted.value = value
}
```

**`fetchGame` — the D-16 consistency reference** (lines 55-60). `applyIncomingGameState` should encapsulate exactly this one line so `fetchGame` becomes `applyIncomingGameState(response.data)`:
```javascript
async function fetchGame() {
  // fetch game data from the server
  let url = `${baseUrl}/game/state`
  const response = await axios.get(url)
  gameState.value = applyGameState(gameState.value, response.data)
}
```

**`setLineup` — refactor target for `applyLineup` (D-06)** (lines 62-88). The inline write is line 70; replace with `applyLineup(func, lineup)`. Note `func` is already the `'offense'`/`'defense'` string, which settles the D-discretion question in favor of `applyLineup(side, lineup)`:
```javascript
async function setLineup(lineup, isDefense) {
  let func = isDefense ? 'defense' : 'offense'
  let url = `${baseUrl}/${func}/lineup`

  isSubmittingLineup.value = true
  try {
    const response = await axios.post(url, lineup)
    gameMsg.value = response.data
    lineups.value[func] = lineup

    // handle success here
  } catch (err) {
    // handle error here
    if (err.response) {
      // handle 400 error here
      let msg = err.response.data
      console.error(`Error setting lineup: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to set ${func} lineup: ${msg}`
    } else {
      error.value = `Failed to set ${func} lineup`
    }
  } finally {
    isSubmittingLineup.value = false
  }
  // convert lineup object to JSON and send it to the server
}
```

**`getLineup` — second `applyLineup` call site** (lines 119-139). Inline write is line 125 (`lineups.value[team] = response.data`); the local var is `team` here, not `func`:
```javascript
async function getLineup(isDefense) {
  let team = isDefense ? 'defense' : 'offense'
  let url = `${baseUrl}/${team}/lineup`

  try {
    const response = await axios.get(url)
    lineups.value[team] = response.data
  } catch (err) {
    // handle error here
    if (err.response) {
      // handle 400 error here
      let msg = err.response.data
      console.error(`Error fetching ${team} lineup: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to fetch ${team} lineup: ${msg}`
    } else {
      error.value = `Failed to fetch ${team} lineup`
    }
  }
  // convert lineup object to JSON and send it to the server
}
```

**`fetchPlayTypes` — refactor target for `applyNextPlayType` (D-06)** (lines 141-164). NOTE: this writes **two** refs (`playTypes` AND `nextPlayType`) in both the success path (lines 147-148) and the error-reset path (lines 152-153). `applyNextPlayType` per D-10 owns only `nextPlayType`; the planner must decide whether `playTypes` stays inline or gets its own apply. The error path resetting to `[]`/`null` must be preserved:
```javascript
async function fetchPlayTypes() {
  let url = `${baseUrl}/game/nexttype`

  try {
    const response = await axios.get(url)

    playTypes.value = response.data.allowed_types || []
    nextPlayType.value = response.data.next_type || null
  } catch (err) {
    // handle error here
    console.error('Error fetching play types:', err)
    playTypes.value = [] // Ensure it's always an array
    nextPlayType.value = null // Reset next play type on error
    if (err.response) {
      // handle 400 error here
      let msg = err.response.data
      console.error(`Error fetching play types: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to fetch play types: ${msg}`
    } else {
      error.value = 'Failed to fetch play types'
    }
  }
}
```
The `response.data.next_type || null` idiom on line 148 is the source of D-10's "tolerate `{ next_type }`" tolerance requirement.

**`setPlayType` — third `applyNextPlayType` call site** (lines 311-332). ⚠ **Important finding: `setPlayType` does NOT currently write `nextPlayType.value` at all** — it only POSTs and sets `gameMsg`. So "refactor `setPlayType` → `applyNextPlayType`" is an *additive* change (optimistic local set), not a pure mechanical extraction. The planner must flag this as a behavior change and confirm it against `gameStore.test.js:84-91`:
```javascript
async function setPlayType(playType) {
  let url = `${baseUrl}/game/nexttype`

  try {
    const response = await axios.post(url, playType, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    gameMsg.value = response.data || 'Play type set successfully'
  } catch (err) {
    console.error('Error setting play type:', err)
    if (err.response) {
      let msg = err.response.data
      console.error(`Error setting play type: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to set play type: ${msg}`
    } else {
      error.value = 'Failed to set play type'
    }
  }
}
```

**`fetchPlayResult` — the literal extraction target for `applyPlayResult` (D-12)** (lines 269-280). Lines 277-279 (plus D-13's `lineupSubmitted.value = false`) move wholesale into `applyPlayResult`; note the existing comment must move with the code since it documents the reducer-derived gate:
```javascript
async function fetchPlayResult() {
  let url = `${baseUrl}/game/plays?result=true&count=1`
  const response = await axios.get(url)
  const newPlay = Array.isArray(response.data) ? response.data[0] : response.data

  // Apply through the reducer first; the array-push gate is derived from
  // whether the reducer actually advanced gameState (single source of truth
  // for "is this a new play?"). No independent play_counter comparison here.
  if (updateGameStateFromPlayResult(newPlay)) {
    playResults.value.push(newPlay)
  }
}
```

**`updateGameStateFromPlayResult` — reused UNCHANGED by `applyPlayResult`** (lines 341-353). This is the `didApply` contract D-03 and D-14 mirror:
```javascript
// Shared function to update game state from play result.
// Returns true only when the reducer actually applied the incoming state
// (i.e. play_counter advanced), so callers can derive downstream decisions
// — like appending to playResults — from the single reducer gate.
function updateGameStateFromPlayResult(playResult) {
  if (playResult && playResult.new_state) {
    const applied = applyGameState(gameState.value, playResult.new_state)
    const didApply = applied !== gameState.value
    gameState.value = applied
    return didApply
  }
  return false
}
```
Note the `playResult && playResult.new_state` guard already implements D-09's strict `data.new_state` requirement — but it returns `false` **silently** with no `console.error`. D-08 demands a *loud* log; that loudness must live in the **dispatch module's** `PlayRun` handler (validating `data.new_state` before calling `applyPlayResult`), not inside this store function, so the REST path's existing silent-skip test (`gameStore.test.js:139-144`) keeps passing.

**`runPlay` — the D-13 redundancy site** (lines 241-267). Line 251 already resets `lineupSubmitted`; after the refactor `fetchPlayResult` → `applyPlayResult` will also reset it. Also note this is the one function that re-throws (line 260):
```javascript
async function runPlay() {
  let url = `${baseUrl}/game/play`

  // convert play object to JSON and send it to the server
  let response
  isRunningPlay.value = true
  try {
    response = await axios.post(url)
    gameMsg.value = response.data
    // Play ran successfully: collapse the lineup/play-call flow for the next play.
    lineupSubmitted.value = false
  } catch (err) {
    if (err.response) {
      let msg = err.response.data
      console.error(`Error running play: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to run play: ${msg}`
    } else {
      error.value = 'Failed to run play'
      throw err
    }
  } finally {
    isRunningPlay.value = false
  }
  // update the game state with the response data
  // gameMsg.value = response.data;
}
```

**Public return surface** (lines 374-413) — the new `apply*` actions must be added here (D-07). Note the existing grouping comments (`// Async feedback state`, `// Play-flow state`, `// Hover state and functions`); add a `// Local-apply actions (do not POST)` group:
```javascript
  // return everything that should be exposed to the store
  return {
    game,
    fetchGame,
    setLineup,
    getLineup,
    setDefensivePlay,
    setOffensivePlay,
    setKickoffPlay,
    gameState,
    gameMsg,
    // Async feedback state
    error,
    clearError,
    isRunningPlay,
    isSubmittingLineup,
    isSubmittingPlay,
    // Play-flow state
    lineupSubmitted,
    setLineupSubmitted,
    getPlayer,
    getHardCodedValue,
    runPlay,
    fetchPlayTypes,
    getPlayTypes,
    getNextPlayType,
    setPlayType,
    fetchPlayResult,
    fetchGameData,
    getPlayResult,
    getAllPlayResults,
    updateGameStateFromPlayResult,
    // Hover state and functions
    hoveredBox,
    relatedBox,
    setHoveredBox,
    clearHover,
    isBoxHighlighted,
    getBoxLabel
  }
})
```

**⚠ Blast-radius note for the planner:** `lineups` is **not** exported on the public surface. Existing tests assert lineup writes indirectly via `store.getPlayer('QB')` (`gameStore.test.js:24, 38`). `applyLineup` being exported does not change that; new dispatch tests use the fake store, so no new store export of `lineups` is required.

---

### `src/stores/gameStore.test.js` (test, request-response) — MODIFIED

**Analog:** itself.

**Setup pattern — Pinia instance + axios mocking** (lines 1-12). This is the exact preamble any added store test must reuse; `vi.mock('axios')` is module-level and `setActivePinia(createPinia())` runs per test:
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'
import { buildLineup } from '../../test/factories/lineup.js'

vi.mock('axios')

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})
```
Note: store import uses `@/stores/gameStore` (no `.js`), factory import uses a relative path with `.js`. File is organized into two top-level describes: `'gameStore success paths'` and `'gameStore error branches'`.

**The tests that MUST keep passing through the D-06 refactor:**

`setLineup` / `getLineup` — assert through `getPlayer` (lines 15-40):
```javascript
it('sets gameMsg, populates lineups, and resets isSubmittingLineup', async () => {
  axios.post.mockResolvedValueOnce({ data: 'lineup ok' })
  const store = useGameStore()
  const lineup = buildLineup()
  await store.setLineup(lineup, false)
  expect(store.gameMsg).toBe('lineup ok')
  // getPlayer reads through the internal lineups ref (not directly exposed),
  // so this proves setLineup actually populated lineups.offense.
  expect(store.getPlayer('QB')).toBe('QB-1')
  expect(store.isSubmittingLineup).toBe(false)
})
```

`fetchPlayTypes` (lines 42-52) and `setPlayType` (lines 84-91) — the latter asserts **only** `gameMsg`, so an additive optimistic `applyNextPlayType` in `setPlayType` will not break it:
```javascript
it('sets playTypes and nextPlayType from the response', async () => {
  axios.get.mockResolvedValueOnce({
    data: { allowed_types: ['Run', 'Pass'], next_type: 'Run' }
  })
  const store = useGameStore()
  await store.fetchPlayTypes()
  expect(store.getPlayTypes).toEqual(['Run', 'Pass'])
  expect(store.getNextPlayType).toBe('Run')
})
```

`runPlay` — already asserts `lineupSubmitted === false` (lines 93-103), so the D-13 redundancy is benign here:
```javascript
it('sets gameMsg, clears lineupSubmitted, and resets isRunningPlay', async () => {
  axios.post.mockResolvedValueOnce({ data: 'play ran' })
  const store = useGameStore()
  store.setLineupSubmitted(true)
  await store.runPlay()
  expect(store.gameMsg).toBe('play ran')
  expect(store.lineupSubmitted).toBe(false)
  expect(store.isRunningPlay).toBe(false)
})
```

`fetchPlayResult` reducer-gate suite (lines 105-145) — the D-12 refactor must leave all four green. Local `play()` helper factory idiom worth reusing:
```javascript
describe('fetchPlayResult (reducer-derived array gate)', () => {
  const play = (counter) => ({ result_type: 'Run', new_state: { play_counter: counter } })

  it('applies a newer play and pushes it onto playResults', async () => {
    axios.get.mockResolvedValueOnce({ data: [play(1)] })
    const store = useGameStore()
    await store.fetchPlayResult()
    expect(store.getAllPlayResults).toHaveLength(1)
    expect(store.gameState.play_counter).toBe(1)
  })

  it('rejects a duplicate play_counter — no push, gameState unchanged', async () => {
    const store = useGameStore()
    axios.get.mockResolvedValueOnce({ data: [play(2)] })
    await store.fetchPlayResult()
    const stateAfterFirst = store.gameState
    // Same counter arrives again (duplicate delivery)
    axios.get.mockResolvedValueOnce({ data: [play(2)] })
    await store.fetchPlayResult()
    expect(store.getAllPlayResults).toHaveLength(1)
    // reducer no-op returns the exact same reference
    expect(store.gameState).toBe(stateAfterFirst)
  })
  // ... 'rejects a stale (lower) play_counter', 'does not push when new_state is missing'
})
```

⚠ **D-13 regression check the planner must schedule:** none of the existing `fetchPlayResult` tests assert `lineupSubmitted`, so adding the reset inside `applyPlayResult` will not fail the current suite. But `fetchGameData` calls `fetchPlayResult`, and `GameLayout.vue`'s play flow reads `lineupSubmitted` — the `<specifics>` note requires a manual/behavioral confirmation that a mid-flow `fetchGameData` cannot now collapse a lineup the user just submitted. D-14 (reset only when the reducer applied) is the mitigation.

---

## Shared Patterns

### Keystone reducer contract — `applyGameState(current, incoming)`
**Source:** `src/game/gameStateReducer.js` lines 45-59
**Apply to:** every `GameState`-bearing dispatch path (`GameStarted` via `applyIncomingGameState`, `PlayRun` via `applyPlayResult` → `updateGameStateFromPlayResult`)

**Exact signature & return contract:**
- Signature: `applyGameState(current, incoming)` — two positional args, both plain objects. **Single named export**; no default export.
- Returns **`incoming` (a new reference)** when `incoming.play_counter` is a finite number strictly greater than `current.play_counter`, OR when `current` has no finite `play_counter` (bootstrap — first valid incoming always applies).
- Returns **`current` by exact reference** otherwise: equal counter (duplicate), lower counter (stale), and missing/`undefined`/`null`/`NaN` incoming counter (malformed). The exact-reference identity is the load-bearing no-op signal.
- **Never throws.** Rejections `console.error` and return `current`.
- Callers derive `didApply` by reference comparison: `const didApply = applied !== gameState.value`.

```javascript
export function applyGameState(current, incoming) {
  if (incoming === null || incoming === undefined) {
    console.error('applyGameState: rejected incoming state — missing or invalid play_counter')
    return current
  }

  if (isNewer(current, incoming)) {
    return incoming
  }

  console.error(
    `applyGameState: rejected incoming state — play_counter ${incoming?.play_counter} is not newer than current`
  )
  return current
}
```
Note the 100-col wrap style on the multi-line `console.error` (open paren, template literal indented, close paren on its own line) — Prettier will produce exactly this.

### Rejection logging (never throw)
**Source:** `src/game/gameEvents.js` lines 35, 41, 46, 51; `src/game/gameStateReducer.js` lines 47, 55-57
**Apply to:** `gameEventDispatch.js` — every reject branch

Format: `` console.error(`<subject>: <verb phrase> — <reason with tag or typeof>`) ``
- `gameEvents.js` uses `Rejecting WS event: <reason>` (colon-separated).
- `gameStateReducer.js` uses `applyGameState: rejected incoming state — <reason>` (module-name prefix + em dash).
- **Both** avoid payload dumps and both return a sentinel instead of throwing.
- Throwing is reserved for startup config failures only (see `src/game/gameSocketUrl.js`).

### Formatting (`.prettierrc.json`)
**Apply to:** all files
```json
{
  "semi": false,
  "tabWidth": 2,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "none"
}
```
Plus repo conventions: `snake_case` preserved on server-shaped fields (`new_state`, `play_counter`, `next_type`, `allowed_types`) — never renamed. Prefer `===`/`!==` in new code (the `==` usages in `gameStore.js` lines 92/112 are legacy, do not imitate).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every file has a close analog. |

**Partial gap worth noting:** there is **no existing zero-mock fake-store fixture** anywhere in the repo — all current store tests use a real Pinia instance plus `vi.mock('axios')`. The fake-store construction for `gameEventDispatch.test.js` is genuinely new; the recommended shape above extrapolates from the plain-object fixture style in `gameStateReducer.test.js`. This is D-01's whole point (avoiding a real Pinia instance), so the novelty is intentional, not an oversight.

## Metadata

**Analog search scope:** `src/game/`, `src/stores/`, `test/factories/`, `.prettierrc.json`
**Files scanned:** 8 (4 read in full, 2 read in targeted ranges, 2 listed)
**Pattern extraction date:** 2026-07-30
