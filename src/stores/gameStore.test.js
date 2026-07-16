import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useGameStore } from '@/stores/gameStore'
import { buildLineup } from '../../test/factories/lineup.js'

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
