// Player record and roster factories. Records carry name, id, and position
// (position is required — TeamData.getPlayersForPositions reads players[id].position).
export function buildPlayer(overrides = {}) {
  return {
    name: 'Joe',
    id: 'QB-1',
    position: 'QB',
    ...overrides
  }
}

// Returns the wrapping { team, availablePlayers, players } shape TeamData
// consumes. The default players map mirrors teamStore's seed (QB-1, RB-1).
// Any key in overrides REPLACES the default (players is replaced wholesale,
// not merged) so tests can define an entirely different roster shape.
export function buildRoster(overrides = {}) {
  return {
    team: { name: 'Testers' },
    availablePlayers: new Set([]),
    players: {
      'QB-1': { name: 'Joe', id: 'QB-1', position: 'QB' },
      'RB-1': { name: 'John', id: 'RB-1', position: 'RB' }
    },
    ...overrides
  }
}
