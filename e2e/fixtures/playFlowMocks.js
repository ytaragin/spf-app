// Full-shape HTTP response body fixtures for e2e/play-flow.spec.js's page.route()
// mocks. These are standalone response bodies (not Pinia-seed objects) - see
// D-08 in 05-CONTEXT.md for why they are kept separate from test/factories/.

/**
 * Response body for `GET {baseUrl}/players/away`, consumed by
 * teamStore.setTeam -> `new TeamData(newTeam)`, which requires a `players`
 * map (each record needs `id`/`position`) and an optional `team.name`.
 */
export const awayPlayersResponse = {
  team: { name: 'Away Team' },
  players: {
    'QB-1': { name: 'Away QB', id: 'QB-1', position: 'QB' },
    'RB-1': { name: 'Away RB', id: 'RB-1', position: 'RB' }
  }
}

/**
 * Response body for `GET {baseUrl}/players/home`, consumed the same way as
 * awayPlayersResponse but for the home roster.
 */
export const homePlayersResponse = {
  team: { name: 'Home Team' },
  players: {
    'QB-1': { name: 'Home QB', id: 'QB-1', position: 'QB' },
    'RB-1': { name: 'Home RB', id: 'RB-1', position: 'RB' }
  }
}

/**
 * Response body for `GET {baseUrl}/game/nexttype`, consumed by
 * gameStore.fetchPlayTypes to populate `playTypes`/`nextPlayType`.
 */
export const nextTypeResponse = {
  allowed_types: ['standard'],
  next_type: 'standard'
}

/**
 * Response body for `POST {baseUrl}/{offense|defense}/lineup`, a plain string
 * ack assigned directly to `gameMsg.value`.
 */
export const lineupAckResponse = 'Lineup set'

/**
 * Response body for `POST {baseUrl}/offense/call` or `/defense/call`, a plain
 * string ack assigned directly to `gameMsg.value`.
 */
export const playCallAckResponse = 'Play set'

/**
 * Response body for `POST {baseUrl}/game/play`, a plain string ack assigned
 * directly to `gameMsg.value`.
 */
export const runPlayAckResponse = 'Play run'

/**
 * Full nine-field gameState body for `GET {baseUrl}/game/state`, matching
 * every key gameStore.js seeds on initial state. Accepts `overrides` to
 * produce variant snapshots (e.g. for successive plays).
 */
export function buildGameStateResponse(overrides = {}) {
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

/**
 * Response body for `GET {baseUrl}/game/plays?result=true&count=1`, an array
 * whose single entry carries a full-shape `new_state` (all gameState fields)
 * plus a `play_counter` that must exceed the previously stored counter for
 * gameStore.fetchPlayResult to accept it. Parameterized by `playCounter` so
 * the spec can produce two distinct, chained bodies proving state continuity
 * (D-03).
 */
export function buildPlayResultResponse(playCounter, overrides = {}) {
  return [
    {
      result_type: 'Complete',
      result: 8,
      new_state: {
        ...buildGameStateResponse(),
        play_counter: playCounter,
        ...overrides
      }
    }
  ]
}
