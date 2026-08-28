import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'
import { buildLineup } from '../../test/factories/lineup.js'
import { buildGameState } from '../../test/factories/gameState.js'

vi.mock('axios')

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('gameStore success paths', () => {
  describe('setLineup', () => {
    it('sets gameMsg, populates lineups, and resets isSubmittingLineup', async () => {
      axios.post.mockResolvedValueOnce({ data: 'lineup ok' })
      const store = useGameStore()
      const lineup = buildLineup()
      await store.setLineup(lineup, false)
      expect(store.gameMsg).toBe('lineup ok')
      // getPlayer reads through the internal lineups ref (not directly exposed),
      // so this proves setLineup actually populated lineups.offense.
      expect(store.getPlayer('QB')).toBe('QB-1')
      expect(store.isSubmittingLineup).toBe(false)
    })
  })

  describe('getLineup', () => {
    it('populates lineups for the team (no loading flag)', async () => {
      const lineup = buildLineup()
      axios.get.mockResolvedValueOnce({ data: lineup })
      const store = useGameStore()
      await store.getLineup(false)
      expect(store.gameMsg).toBe('+++')
      // getPlayer reads through the internal lineups ref (not directly exposed),
      // so this proves getLineup actually populated lineups.offense.
      expect(store.getPlayer('QB')).toBe('QB-1')
    })
  })

  describe('fetchPlayTypes', () => {
    it('sets playTypes and nextPlayType from the response', async () => {
      axios.get.mockResolvedValueOnce({
        data: { allowed_types: ['Run', 'Pass'], next_type: 'Run' }
      })
      const store = useGameStore()
      await store.fetchPlayTypes()
      expect(store.getPlayTypes).toEqual(['Run', 'Pass'])
      expect(store.getNextPlayType).toBe('Run')
    })
  })

  describe('setDefensivePlay', () => {
    it('sets gameMsg and resets isSubmittingPlay', async () => {
      axios.post.mockResolvedValueOnce({ data: 'def ok' })
      const store = useGameStore()
      await store.setDefensivePlay({})
      expect(store.gameMsg).toBe('def ok')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setOffensivePlay', () => {
    it('sets gameMsg and resets isSubmittingPlay', async () => {
      axios.post.mockResolvedValueOnce({ data: 'off ok' })
      const store = useGameStore()
      await store.setOffensivePlay({})
      expect(store.gameMsg).toBe('off ok')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setKickoffPlay', () => {
    it('sets gameMsg and resets isSubmittingPlay', async () => {
      axios.post.mockResolvedValueOnce({ data: 'kick ok' })
      const store = useGameStore()
      await store.setKickoffPlay({ onside: true })
      expect(store.gameMsg).toBe('kick ok')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setPlayType', () => {
    it('sets gameMsg from the response (no loading flag)', async () => {
      axios.post.mockResolvedValueOnce({ data: 'type set' })
      const store = useGameStore()
      await store.setPlayType('Run')
      expect(store.gameMsg).toBe('type set')
    })

    it('optimistically applies the play type locally through applyNextPlayType', async () => {
      axios.post.mockResolvedValueOnce({ data: 'type set' })
      const store = useGameStore()
      await store.setPlayType('Pass')
      expect(store.getNextPlayType).toBe('Pass')
    })
  })

  describe('runPlay', () => {
    it('sets gameMsg, clears lineupSubmitted, and resets isRunningPlay', async () => {
      axios.post.mockResolvedValueOnce({ data: 'play ran' })
      const store = useGameStore()
      store.setLineupSubmitted(true)
      await store.runPlay()
      expect(store.gameMsg).toBe('play ran')
      expect(store.lineupSubmitted).toBe(false)
      expect(store.isRunningPlay).toBe(false)
    })
  })

  describe('fetchPlayResult (reducer-derived array gate)', () => {
    const play = (counter) => ({ result_type: 'Run', new_state: { play_counter: counter } })

    it('applies a newer play and pushes it onto playResults', async () => {
      axios.get.mockResolvedValueOnce({ data: [play(1)] })
      const store = useGameStore()
      await store.fetchPlayResult()
      expect(store.getAllPlayResults).toHaveLength(1)
      expect(store.gameState.play_counter).toBe(1)
    })

    it('rejects a duplicate play_counter — no push, gameState unchanged', async () => {
      const store = useGameStore()
      axios.get.mockResolvedValueOnce({ data: [play(2)] })
      await store.fetchPlayResult()
      const stateAfterFirst = store.gameState
      // Same counter arrives again (duplicate delivery)
      axios.get.mockResolvedValueOnce({ data: [play(2)] })
      await store.fetchPlayResult()
      expect(store.getAllPlayResults).toHaveLength(1)
      // reducer no-op returns the exact same reference
      expect(store.gameState).toBe(stateAfterFirst)
    })

    it('rejects a stale (lower) play_counter — no push', async () => {
      const store = useGameStore()
      axios.get.mockResolvedValueOnce({ data: [play(5)] })
      await store.fetchPlayResult()
      axios.get.mockResolvedValueOnce({ data: [play(3)] })
      await store.fetchPlayResult()
      expect(store.getAllPlayResults).toHaveLength(1)
      expect(store.gameState.play_counter).toBe(5)
    })

    it('does not push when new_state is missing', async () => {
      axios.get.mockResolvedValueOnce({ data: [{ result_type: 'Run' }] })
      const store = useGameStore()
      await store.fetchPlayResult()
      expect(store.getAllPlayResults).toHaveLength(0)
    })
  })

  describe('applyPlayResult (local-apply, no POST)', () => {
    const play = (counter) => ({ result_type: 'Run', new_state: { play_counter: counter } })

    it('applies a newer play, pushes it, and returns true', () => {
      const store = useGameStore()
      expect(store.applyPlayResult(play(1))).toBe(true)
      expect(store.gameState.play_counter).toBe(1)
      expect(store.getAllPlayResults).toHaveLength(1)
    })

    it('rejects a duplicate play_counter — returns false, no push, same state reference', () => {
      const store = useGameStore()
      store.applyPlayResult(play(2))
      const stateBefore = store.gameState
      expect(store.applyPlayResult(play(2))).toBe(false)
      expect(store.getAllPlayResults).toHaveLength(1)
      expect(store.gameState).toBe(stateBefore)
    })

    it('rejects a stale (lower) play_counter — returns false, no push, same state reference', () => {
      const store = useGameStore()
      store.applyPlayResult(play(5))
      const stateBefore = store.gameState
      expect(store.applyPlayResult(play(3))).toBe(false)
      expect(store.getAllPlayResults).toHaveLength(1)
      // a lower counter cannot regress gameState (ordering guarantee)
      expect(store.gameState).toBe(stateBefore)
    })

    it('clears lineupSubmitted when the reducer actually advanced (D-13)', () => {
      const store = useGameStore()
      store.applyPlayResult(play(1))
      store.setLineupSubmitted(true)
      store.applyPlayResult(play(2))
      expect(store.lineupSubmitted).toBe(false)
    })

    it('leaves lineupSubmitted set on a duplicate or stale delivery (D-14)', () => {
      const store = useGameStore()
      store.applyPlayResult(play(5))
      store.setLineupSubmitted(true)
      store.applyPlayResult(play(5))
      expect(store.lineupSubmitted).toBe(true)
      store.applyPlayResult(play(3))
      expect(store.lineupSubmitted).toBe(true)
    })

    it('returns false and pushes nothing when new_state is missing', () => {
      const store = useGameStore()
      store.setLineupSubmitted(true)
      expect(store.applyPlayResult({ result_type: 'Run' })).toBe(false)
      expect(store.getAllPlayResults).toHaveLength(0)
      expect(store.lineupSubmitted).toBe(true)
    })
  })

  describe('applyIncomingGameState (local-apply, no POST)', () => {
    it('applies a newer state through the reducer and returns true', () => {
      const store = useGameStore()
      expect(store.applyIncomingGameState(buildGameState({ play_counter: 1 }))).toBe(true)
      expect(store.gameState.play_counter).toBe(1)
    })

    it('rejects a duplicate play_counter — returns false, same state reference', () => {
      const store = useGameStore()
      store.applyIncomingGameState(buildGameState({ play_counter: 1 }))
      const stateBefore = store.gameState
      expect(store.applyIncomingGameState(buildGameState({ play_counter: 1 }))).toBe(false)
      expect(store.gameState).toBe(stateBefore)
    })

    it('rejects a stale (lower) play_counter — returns false, state unchanged', () => {
      const store = useGameStore()
      store.applyIncomingGameState(buildGameState({ play_counter: 5 }))
      const stateBefore = store.gameState
      expect(store.applyIncomingGameState(buildGameState({ play_counter: 3 }))).toBe(false)
      expect(store.gameState).toBe(stateBefore)
      expect(store.gameState.play_counter).toBe(5)
    })

    it('performs no collateral resets (D-17)', () => {
      const store = useGameStore()
      store.applyPlayResult({ result_type: 'Run', new_state: { play_counter: 1 } })
      store.setLineupSubmitted(true)
      const resultsBefore = store.getAllPlayResults.length
      const nextTypeBefore = store.getNextPlayType

      expect(store.applyIncomingGameState(buildGameState({ play_counter: 2 }))).toBe(true)

      expect(store.getAllPlayResults).toHaveLength(resultsBefore)
      expect(store.lineupSubmitted).toBe(true)
      expect(store.getNextPlayType).toBe(nextTypeBefore)
    })
  })

  describe('applyLineup (local-apply, no POST)', () => {
    it('stores the offense lineup so getPlayer resolves it', () => {
      const store = useGameStore()
      store.applyLineup('offense', buildLineup())
      expect(store.getPlayer('QB')).toBe('QB-1')
    })

    it('stores the defense lineup, which getPlayer resolves ahead of offense', () => {
      const store = useGameStore()
      store.applyLineup('defense', buildLineup({ QB: 'DEF-QB' }))
      expect(store.getPlayer('QB')).toBe('DEF-QB')
    })

    it('keeps the two sides isolated and is idempotent on repeat delivery', () => {
      const store = useGameStore()
      // RB is present only on offense; the defense fixture blanks it, so getPlayer
      // falls through to the offense side for that position.
      store.applyLineup('offense', buildLineup({ RB: 'OFF-RB' }))
      store.applyLineup('defense', buildLineup({ QB: 'DEF-QB', RB: '' }))
      expect(store.getPlayer('QB')).toBe('DEF-QB')
      expect(store.getPlayer('RB')).toBe('OFF-RB')

      // last-writer-wins on lineups[side]: a repeat is naturally idempotent and
      // never leaks across sides.
      store.applyLineup('defense', buildLineup({ QB: 'DEF-QB', RB: '' }))
      expect(store.getPlayer('QB')).toBe('DEF-QB')
      expect(store.getPlayer('RB')).toBe('OFF-RB')
    })
  })

  describe('applyNextPlayType (local-apply, no POST)', () => {
    it('stores a bare non-empty string', () => {
      const store = useGameStore()
      store.applyNextPlayType('Run')
      expect(store.getNextPlayType).toBe('Run')
    })

    it('unwraps the { next_type } response shape from /game/nexttype (D-10)', () => {
      const store = useGameStore()
      store.applyNextPlayType({ next_type: 'Pass' })
      expect(store.getNextPlayType).toBe('Pass')
    })

    it('normalizes null and undefined to null', () => {
      const store = useGameStore()
      store.applyNextPlayType('Run')
      store.applyNextPlayType(null)
      expect(store.getNextPlayType).toBe(null)
      store.applyNextPlayType('Run')
      store.applyNextPlayType(undefined)
      expect(store.getNextPlayType).toBe(null)
    })

    it('normalizes a non-string, non-{next_type} input to null rather than storing garbage', () => {
      const store = useGameStore()
      store.applyNextPlayType(42)
      expect(store.getNextPlayType).toBe(null)
      store.applyNextPlayType('')
      expect(store.getNextPlayType).toBe(null)
      store.applyNextPlayType({ nope: 'Run' })
      expect(store.getNextPlayType).toBe(null)
    })

    it('is idempotent on repeat delivery (last-writer-wins)', () => {
      const store = useGameStore()
      store.applyNextPlayType('Run')
      store.applyNextPlayType('Run')
      expect(store.getNextPlayType).toBe('Run')
    })
  })
})

describe('gameStore error branches', () => {
  describe('setLineup', () => {
    it('err.response branch sets error/gameMsg, logs, and resets flag', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'bad lineup' } })
      const store = useGameStore()
      await store.setLineup({}, false)
      expect(store.gameMsg).toBe('bad lineup')
      expect(store.error).toContain('bad lineup')
      expect(spy).toHaveBeenCalled()
      expect(store.isSubmittingLineup).toBe(false)
    })

    it('network branch falls back and resets flag', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.setLineup({}, false)
      expect(store.error).toBe('Failed to set offense lineup')
      expect(store.isSubmittingLineup).toBe(false)
    })
  })

  describe('getLineup', () => {
    it('err.response branch sets error/gameMsg and logs', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.get.mockRejectedValueOnce({ response: { data: 'no lineup' } })
      const store = useGameStore()
      await store.getLineup(false)
      expect(store.gameMsg).toBe('no lineup')
      expect(store.error).toContain('no lineup')
      expect(spy).toHaveBeenCalled()
    })

    it('network branch falls back', async () => {
      axios.get.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.getLineup(false)
      expect(store.error).toBe('Failed to fetch offense lineup')
    })
  })

  describe('setDefensivePlay', () => {
    it('err.response branch sets error/gameMsg, logs, and resets flag', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'def bad' } })
      const store = useGameStore()
      await store.setDefensivePlay({})
      expect(store.gameMsg).toBe('def bad')
      expect(store.error).toContain('def bad')
      expect(spy).toHaveBeenCalled()
      expect(store.isSubmittingPlay).toBe(false)
    })

    it('network branch uses err.message and resets flag', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.setDefensivePlay({})
      expect(store.gameMsg).toBe('network down')
      expect(store.error).toContain('network down')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setOffensivePlay', () => {
    it('err.response branch sets error/gameMsg, logs, and resets flag', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'off bad' } })
      const store = useGameStore()
      await store.setOffensivePlay({})
      expect(store.gameMsg).toBe('off bad')
      expect(store.error).toContain('off bad')
      expect(spy).toHaveBeenCalled()
      expect(store.isSubmittingPlay).toBe(false)
    })

    it('network branch uses err.message and resets flag', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.setOffensivePlay({})
      expect(store.gameMsg).toBe('network down')
      expect(store.error).toContain('network down')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setKickoffPlay', () => {
    it('err.response branch sets error/gameMsg, logs, and resets flag', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'kick bad' } })
      const store = useGameStore()
      await store.setKickoffPlay({})
      expect(store.gameMsg).toBe('kick bad')
      expect(store.error).toContain('kick bad')
      expect(spy).toHaveBeenCalled()
      expect(store.isSubmittingPlay).toBe(false)
    })

    it('network branch uses err.message and resets flag', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.setKickoffPlay({})
      expect(store.gameMsg).toBe('network down')
      expect(store.error).toContain('network down')
      expect(store.isSubmittingPlay).toBe(false)
    })
  })

  describe('setPlayType', () => {
    it('err.response branch sets error/gameMsg and logs', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'type bad' } })
      const store = useGameStore()
      await store.setPlayType('Run')
      expect(store.gameMsg).toBe('type bad')
      expect(store.error).toContain('type bad')
      expect(spy).toHaveBeenCalled()
    })

    it('network branch falls back', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.setPlayType('Run')
      expect(store.error).toBe('Failed to set play type')
    })
  })

  describe('fetchPlayTypes', () => {
    it('err.response branch sets error/gameMsg and logs', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.get.mockRejectedValueOnce({ response: { data: 'types bad' } })
      const store = useGameStore()
      await store.fetchPlayTypes()
      expect(store.gameMsg).toBe('types bad')
      expect(store.error).toContain('types bad')
      expect(store.getPlayTypes).toEqual([])
      expect(store.getNextPlayType).toBe(null)
      expect(spy).toHaveBeenCalled()
    })

    it('network branch falls back', async () => {
      axios.get.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await store.fetchPlayTypes()
      expect(store.error).toBe('Failed to fetch play types')
    })
  })

  describe('runPlay', () => {
    it('err.response branch sets error/gameMsg, logs, and resets flag', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      axios.post.mockRejectedValueOnce({ response: { data: 'play bad' } })
      const store = useGameStore()
      await store.runPlay()
      expect(store.gameMsg).toBe('play bad')
      expect(store.error).toContain('play bad')
      expect(spy).toHaveBeenCalled()
      expect(store.isRunningPlay).toBe(false)
    })

    it('network branch re-throws, sets error, and resets flag', async () => {
      axios.post.mockRejectedValueOnce({ message: 'network down' })
      const store = useGameStore()
      await expect(store.runPlay()).rejects.toBeTruthy()
      expect(store.error).toBe('Failed to run play')
      expect(store.isRunningPlay).toBe(false)
    })
  })
})
