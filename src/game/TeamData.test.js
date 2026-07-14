import { describe, it, expect } from 'vitest'
import { TeamData } from '@/game/TeamData.js'

const makePlayers = () => ({
  p1: { id: 'p1', position: 'QB' },
  p2: { id: 'p2', position: 'RB' },
  p3: { id: 'p3', position: 'RB' }
})

const makeTeam = (team = { name: 'Testers' }) => new TeamData({ team, players: makePlayers() })

describe('TeamData', () => {
  describe('constructor', () => {
    it('resets all players to available on construction', () => {
      const team = makeTeam()
      expect(team.availablePlayerIDs()).toEqual(expect.arrayContaining(['p1', 'p2', 'p3']))
      expect(team.availablePlayerIDs()).toHaveLength(3)
    })
  })

  describe('getPlayerByID', () => {
    it('returns the player object for a known id', () => {
      const team = makeTeam()
      expect(team.getPlayerByID('p1')).toEqual({ id: 'p1', position: 'QB' })
    })
  })

  describe('assignPlayer', () => {
    it('removes the player from availability and returns true', () => {
      const team = makeTeam()
      expect(team.assignPlayer('p1')).toBe(true)
      expect(team.availablePlayerIDs()).not.toContain('p1')
    })
  })

  describe('resetPlayer', () => {
    it('restores an assigned player to availability', () => {
      const team = makeTeam()
      team.assignPlayer('p1')
      team.resetPlayer('p1')
      expect(team.availablePlayerIDs()).toContain('p1')
    })
  })

  describe('resetAllPlayers', () => {
    it('restores all players to availability after multiple assignments', () => {
      const team = makeTeam()
      team.assignPlayer('p1')
      team.assignPlayer('p2')
      team.resetAllPlayers()
      expect(team.availablePlayerIDs()).toEqual(expect.arrayContaining(['p1', 'p2', 'p3']))
      expect(team.availablePlayerIDs()).toHaveLength(3)
    })
  })

  describe('getPlayersForPositions', () => {
    it('returns ids matching the given positions', () => {
      const team = makeTeam()
      expect(team.getPlayersForPositions(['RB'])).toEqual(expect.arrayContaining(['p2', 'p3']))
    })

    it('only returns currently-available players', () => {
      const team = makeTeam()
      team.assignPlayer('p2')
      expect(team.getPlayersForPositions(['RB'])).toEqual(['p3'])
    })
  })

  describe('allPlayers', () => {
    it('returns the full players object unchanged', () => {
      const team = makeTeam()
      expect(team.allPlayers()).toEqual(makePlayers())
    })
  })

  describe('teamName', () => {
    it('returns the team name when present', () => {
      const team = makeTeam()
      expect(team.teamName()).toBe('Testers')
    })

    it('returns the fallback "XYZ" when team has no name', () => {
      const team = makeTeam({})
      expect(team.teamName()).toBe('XYZ')
    })
  })
})
