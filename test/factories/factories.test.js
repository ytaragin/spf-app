import { describe, it, expect } from 'vitest'
import { buildGameState } from './gameState.js'
import { buildLineup } from './lineup.js'
import { buildPlayer, buildRoster } from './players.js'
import { TeamData } from '@/game/TeamData.js'

describe('buildGameState', () => {
  it('returns the default snake_case gameState shape', () => {
    expect(buildGameState()).toEqual({
      home_score: 0,
      away_score: 0,
      quarter: 1,
      time_remaining: '15:00',
      possession: 'Home',
      yard_line: 25,
      first_down_target: 35,
      last_status: 'Start',
      down: 'First'
    })
  })

  it('overrides only the targeted field', () => {
    const state = buildGameState({ down: 'Second' })
    expect(state.down).toBe('Second')
    expect(state.home_score).toBe(0)
    expect(state.quarter).toBe(1)
  })
})

describe('buildLineup', () => {
  it('returns a lineup object', () => {
    expect(typeof buildLineup()).toBe('object')
    expect(buildLineup().QB).toBe('QB-1')
    expect(buildLineup().WR).toEqual(['WR-1', 'WR-2'])
  })

  it('merges overrides into the lineup', () => {
    expect(buildLineup({ QB: 'QB-9' }).QB).toBe('QB-9')
  })
})

describe('buildPlayer', () => {
  it('returns a record with name, id, and position', () => {
    const player = buildPlayer()
    expect(player).toHaveProperty('name')
    expect(player).toHaveProperty('id')
    expect(player).toHaveProperty('position')
  })
})

describe('buildRoster', () => {
  it('constructs a TeamData without throwing and exposes the seeded ids', () => {
    let team
    expect(() => {
      team = new TeamData(buildRoster())
    }).not.toThrow()
    expect(team.availablePlayerIDs()).toEqual(expect.arrayContaining(['QB-1', 'RB-1']))
  })

  it('replaces the players map wholesale via overrides', () => {
    const roster = buildRoster({
      players: { 'WR-1': { name: 'Rex', id: 'WR-1', position: 'WR' } }
    })
    const team = new TeamData(roster)
    expect(team.availablePlayerIDs()).toEqual(['WR-1'])
  })
})
