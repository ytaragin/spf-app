/**
 * WebSocket game-event envelope validation.
 *
 * Pure — no Vue/store access; validates the tagged `{ event, data }` envelope
 * shape only. Callers pass an already-parsed object (never a raw JSON string):
 * this module does not deserialize. Never throws — malformed or unknown-variant
 * envelopes resolve to `null` so callers can use the defensive-null / ignore
 * pattern.
 */

const KNOWN_VARIANTS = new Set([
  'GameStarted',
  'OffensiveLineupSet',
  'DefensiveLineupSet',
  'NextPlayTypeSet',
  'PlayRun'
])

/**
 * Validate and unwrap a tagged WebSocket event envelope.
 *
 * Accepts an already-parsed object (does NOT deserialize). On a valid known
 * variant, returns the envelope pass-through unchanged as `{ event, data }`
 * with `data` untouched (wire naming preserved — never renamed to
 * `type`/`payload`). Rejects to `null` (logging via `console.error` with a
 * leading context phrase and the offending event tag — never the full payload)
 * when `raw` is not an object, `raw.event` is missing/non-string, `raw.data` is
 * missing, or `raw.event` is not a known variant. Never throws.
 *
 * @param {object} raw  an already-parsed envelope object
 * @returns {{ event: string, data: * }|null}
 */
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
