/**
 * Monotonic game-state reducer.
 *
 * The single shared apply-path gate for `gameState` writes, keyed on the
 * server-authoritative `play_counter` field. Both the existing REST play
 * flow (this phase) and the future WebSocket path (Phase 8+) funnel every
 * `gameState` write through `applyGameState`. Pure functions only — no
 * Vue/store/axios access — never throws.
 */

/**
 * True when `incoming` carries a strictly newer `play_counter` than
 * `current`. Rejects (returns false) when `incoming.play_counter` is not a
 * finite number (missing, undefined, null, NaN, non-numeric). Treats a
 * `current` with no `play_counter` field at all (bootstrap) as always-older,
 * so any valid incoming counter is newer.
 */
function isNewer(current, incoming) {
  const incomingCounter = incoming?.play_counter
  if (!Number.isFinite(incomingCounter)) return false

  const currentCounter = current?.play_counter
  const currentBaseline = Number.isFinite(currentCounter) ? currentCounter : -Infinity

  return incomingCounter > currentBaseline
}

/**
 * Apply an incoming game state to the current one, gated on `play_counter`.
 *
 * Returns `incoming` (a new reference) when its `play_counter` is strictly
 * greater than `current`'s (or when `current` has no `play_counter` field
 * yet, i.e. the bootstrap case — the first valid incoming state always
 * applies). Otherwise returns `current` by exact reference, unchanged — this
 * includes equal `play_counter` (duplicate delivery), older `play_counter`
 * (stale/out-of-order), and missing/undefined/null/NaN incoming
 * `play_counter` (malformed input). The exact-reference no-op contract is
 * required for Vue reactivity to skip re-rendering on convergent applies.
 * Never throws — malformed input is logged via `console.error` and rejected.
 *
 * @param {object} current   the current `gameState` (may lack `play_counter`)
 * @param {object} incoming  the candidate state to apply
 * @returns {object} either `incoming` (applied) or `current` (unchanged)
 */
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
