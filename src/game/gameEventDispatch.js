/**
 * WebSocket game-event dispatch.
 *
 * Pure router — zero imports, no Vue/store/HTTP access; the store is injected as a
 * parameter so tests can pass a plain fake object. Receives an already-parsed,
 * already-validated `{ event, data }` envelope (the output of `parseEvent`):
 * this module does not deserialize and does not call `parseEvent` itself. All
 * state writes go through injected local-apply store actions — never a raw
 * assignment and never a POSTing `set*` action. Never throws — malformed
 * envelopes and unusable payloads are logged via `console.error` and ignored.
 *
 * Covers exactly the 5 `KNOWN_VARIANTS` declared in `gameEvents.js` — one branch
 * per variant, no more and no less. The two lists must stay in lockstep: a
 * variant added there without a branch here silently falls into the unknown-tag
 * reject.
 */

/**
 * True when `value` is a usable payload object (non-null, not an array-free
 * primitive). Shared by the per-variant guard clauses below; each caller still
 * emits its own variant-specific message so the event tag always appears in the
 * log output.
 */
function isPayloadObject(value) {
  return value !== null && typeof value === 'object'
}

/**
 * Route a validated WebSocket event envelope to the matching store action.
 *
 * Validates the envelope shape, then the per-variant payload, before touching
 * the store: on any mismatch it logs (interpolating only the event tag and/or a
 * `typeof` — never the payload) and returns `false` with zero store actions
 * called. The `NextPlayTypeSet` variant forwards its payload unchanged so the
 * store action owns normalization.
 *
 * @param {object} store  the gameStore instance, injected (not imported)
 * @param {{ event: string, data: * }} event  an already-parsed envelope
 * @returns {boolean} `true` when a store mutation was actually performed,
 *   `false` when the event was ignored (malformed, unknown tag, or reducer no-op)
 */
export function dispatchEvent(store, event) {
  if (event === null || typeof event !== 'object') {
    console.error(
      `dispatchEvent: ignoring envelope — input is not an object (received ${typeof event})`
    )
    return false
  }

  const tag = event.event
  if (typeof tag !== 'string') {
    console.error(
      `dispatchEvent: ignoring envelope — missing or non-string event tag (received ${typeof tag})`
    )
    return false
  }

  const data = event.data

  switch (tag) {
    case 'PlayRun': {
      if (data === null || typeof data !== 'object') {
        console.error(
          `dispatchEvent: ignoring ${tag} — data is not an object (received ${typeof data})`
        )
        return false
      }

      const newState = data.new_state
      if (newState === null || typeof newState !== 'object') {
        console.error(`dispatchEvent: ignoring ${tag} — missing or invalid data.new_state`)
        return false
      }

      // Pass the whole PlayAndState; the boolean verdict is the store action's
      // own reducer-derived didApply, never an independent comparison here.
      return store.applyPlayResult(data) === true
    }

    case 'GameStarted': {
      if (!isPayloadObject(data)) {
        console.error(
          `dispatchEvent: ignoring GameStarted — data is not a game state object (received ${typeof data})`
        )
        return false
      }

      // Straight to the monotonic reducer wrapper. Deliberately NOT wrapped as a
      // play result: that would push a play-less object onto playResults and
      // trip the lineupSubmitted reset (D-16). No fetch, no collateral resets.
      return store.applyIncomingGameState(data) === true
    }

    case 'OffensiveLineupSet': {
      if (!isPayloadObject(data)) {
        console.error(
          `dispatchEvent: ignoring OffensiveLineupSet — data is not a lineup object (received ${typeof data})`
        )
        return false
      }

      // Local-apply only; the POSTing setLineup sibling is never reachable here.
      store.applyLineup('offense', data)
      return true
    }

    case 'DefensiveLineupSet': {
      if (!isPayloadObject(data)) {
        console.error(
          `dispatchEvent: ignoring DefensiveLineupSet — data is not a lineup object (received ${typeof data})`
        )
        return false
      }

      store.applyLineup('defense', data)
      return true
    }

    case 'NextPlayTypeSet': {
      const bare = typeof data === 'string' && data !== ''
      const wrapped =
        isPayloadObject(data) && typeof data.next_type === 'string' && data.next_type !== ''
      if (!bare && !wrapped) {
        console.error(`dispatchEvent: ignoring NextPlayTypeSet — data is not a play type`)
        return false
      }

      // Pass `data` through unchanged — the local-apply store action owns the
      // single implementation of the string / { next_type } normalization (D-10).
      store.applyNextPlayType(data)
      return true
    }

    default:
      console.error(`dispatchEvent: ignoring unknown event tag ${tag}`)
      return false
  }
}
