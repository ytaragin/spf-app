// Offense/defense lineup factory shaped like what setLineup posts and getLineup
// receives — a plain map of position keys to player-id values.
export function buildLineup(overrides = {}) {
  return {
    QB: 'QB-1',
    RB: 'RB-1',
    WR: ['WR-1', 'WR-2'],
    ...overrides
  }
}
