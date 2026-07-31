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
 */

/**
 * Route a validated WebSocket event envelope to the matching store action.
 *
 * Validates the envelope shape, then the per-variant payload, before touching
 * the store: on any mismatch it logs (interpolating only the event tag and/or a
 * `typeof` — never the payload) and returns `false` with zero store actions
 * called. Currently only the `PlayRun` branch is implemented; the remaining
 * variants fall through to the unknown-tag branch until plans 08-02 / 08-03
 * wire them.
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

    default:
      console.error(`dispatchEvent: ignoring unknown event tag ${tag}`)
      return false
  }
}
