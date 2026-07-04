/**
 * Play-outcome classification.
 *
 * Single source of truth for how a play result is colored / iconed / labelled
 * across the UI (PlayResult, PlayHistory, ...). Pure functions only — no store
 * access — so the "perspective" (did the managed team benefit?) is passed in by
 * the caller via the `favorable` option.
 *
 * Colors are Vuetify theme color names; icons are MDI names.
 */

const TURNOVER_TYPE = 'TurnOver'

/** True when the play result is a turnover. */
export function isTurnover(result) {
  return result?.result_type === TURNOVER_TYPE
}

/** Net yards on the play (0 when absent/non-numeric). */
export function netYards(result) {
  const n = Number(result?.result)
  return Number.isFinite(n) ? n : 0
}

/**
 * Icon reflects the raw event, independent of which team benefits:
 * turnover -> alert, positive yardage -> arrow up, otherwise -> football.
 */
export function outcomeIcon(result) {
  if (isTurnover(result)) return 'mdi-alert-octagon'
  if (netYards(result) > 0) return 'mdi-arrow-up-bold'
  return 'mdi-football'
}

/**
 * Human label for the outcome headline, e.g. "Turnover" or the raw result type.
 */
export function outcomeLabel(result) {
  if (isTurnover(result)) return 'Turnover'
  return result?.result_type || 'Result'
}

/**
 * Short summary line, e.g. "Turnover - -3 yards" or "Complete - 8 yards".
 */
export function outcomeSummary(result) {
  if (isTurnover(result)) return `Turnover - ${netYards(result)} yards`
  return `${result?.result_type ?? 'Result'} - ${netYards(result)} yards`
}

/**
 * Whether the raw event is "good for the offense" (the team that had the ball):
 * a positive-yardage, non-turnover play. Turnovers and no-gain/loss plays are
 * bad for the offense.
 */
function goodForOffense(result) {
  return !isTurnover(result) && netYards(result) > 0
}

/**
 * Outcome color as a Vuetify theme color name, from the managed team's
 * perspective.
 *
 * @param {object} result   the play's `result` object
 * @param {object} [opts]
 * @param {boolean} [opts.favorable=true]  true when the managed team had
 *   possession on this play (i.e. was on offense). When the managed team was
 *   defending, pass `false` to invert good/bad — a turnover then reads as a
 *   success for the defense.
 */
export function outcomeColor(result, { favorable = true } = {}) {
  const goodForBallCarrier = goodForOffense(result)
  // If the managed team was NOT the ball carrier (defending), invert.
  const goodForUs = favorable ? goodForBallCarrier : !goodForBallCarrier
  return goodForUs ? 'success' : 'error'
}

/**
 * Convenience: everything needed to render an outcome badge/alert in one call.
 */
export function classifyOutcome(result, opts = {}) {
  return {
    color: outcomeColor(result, opts),
    icon: outcomeIcon(result),
    label: outcomeLabel(result),
    summary: outcomeSummary(result),
    isTurnover: isTurnover(result),
    netYards: netYards(result)
  }
}

/**
 * Perspective helper: did the managed team have possession on this play?
 *
 * Compares the play's possession (`play.new_state.possession`, "Home"/"Away" as
 * returned by the server) to the managed team ("Home"/"Away"). Returns true when
 * they match (managed team was on offense), which is the `favorable` value to pass
 * to `outcomeColor` / `classifyOutcome`.
 */
export function managedTeamHadPossession(play, managedTeam) {
  const possession = play?.new_state?.possession
  if (!possession || !managedTeam) return true // default to offense perspective
  return possession === managedTeam
}
