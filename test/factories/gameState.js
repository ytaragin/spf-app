// Backend-shaped gameState factory (snake_case fields must NOT be renamed).
// Mirrors the default gameState ref in src/stores/gameStore.js so store,
// component, and E2E tests share one realistic seed shape.
export function buildGameState(overrides = {}) {
  return {
    home_score: 0,
    away_score: 0,
    quarter: 1,
    time_remaining: '15:00',
    possession: 'Home',
    yard_line: 25,
    first_down_target: 35,
    last_status: 'Start',
    down: 'First',
    ...overrides
  }
}
