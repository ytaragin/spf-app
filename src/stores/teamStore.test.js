import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useTeamsStore } from '@/stores/teamStore'
import { buildRoster } from '../../test/factories/players.js'

vi.mock('axios')

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('fetchPlayers', () => {
  it('fetches both teams, increments version, and re-points the active team ref', async () => {
    axios.get
      .mockResolvedValueOnce({ data: buildRoster() })
      .mockResolvedValueOnce({ data: buildRoster() })
    const store = useTeamsStore()
    const startVersion = store.version
    await store.fetchPlayers()
    expect(store.isLoading).toBe(false)
    expect(store.version).toBe(startVersion + 1)
    expect(store.availablePlayerIDs).toEqual(expect.arrayContaining(['QB-1', 'RB-1']))
  })

  it('err.response branch is swallowed and resets isLoading', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    axios.get.mockRejectedValueOnce({ response: { status: 500, data: 'boom' } })
    const store = useTeamsStore()
    await expect(store.fetchPlayers()).resolves.toBeUndefined()
    expect(store.isLoading).toBe(false)
    expect(spy).toHaveBeenCalled()
  })

  it('network/request branch is swallowed and resets isLoading', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    axios.get.mockRejectedValueOnce({ request: {}, message: 'no response' })
    const store = useTeamsStore()
    await expect(store.fetchPlayers()).resolves.toBeUndefined()
    expect(store.isLoading).toBe(false)
    expect(spy).toHaveBeenCalled()
  })
})

describe('selectPlayer / removePlayer', () => {
  // Seed the managed (Home) team via a fetchPlayers success so team.value points
  // at the seeded roster (fetchPlayers re-points team.value to teams[managedTeam]).
  async function seedManagedTeam(store) {
    axios.get
      .mockResolvedValueOnce({ data: buildRoster() })
      .mockResolvedValueOnce({ data: buildRoster() })
    await store.fetchPlayers()
  }

  it('assigns a player to a spot and removes them from availability', async () => {
    const store = useTeamsStore()
    await seedManagedTeam(store)
    store.selectPlayer('QB-1', 'box-1')
    expect(store.playerPositions['box-1']).toEqual({ name: 'Joe', id: 'QB-1', position: 'QB' })
    expect(store.availablePlayerIDs).not.toContain('QB-1')
  })

  it('reassigning a spot resets the previously-assigned player to available', async () => {
    const store = useTeamsStore()
    await seedManagedTeam(store)
    store.selectPlayer('QB-1', 'box-1')
    store.selectPlayer('RB-1', 'box-1')
    expect(store.playerPositions['box-1'].id).toBe('RB-1')
    expect(store.availablePlayerIDs).toContain('QB-1')
    expect(store.availablePlayerIDs).not.toContain('RB-1')
  })

  it('removePlayer deletes the spot and returns the player to available', async () => {
    const store = useTeamsStore()
    await seedManagedTeam(store)
    store.selectPlayer('QB-1', 'box-1')
    store.removePlayer('box-1')
    expect(store.playerPositions['box-1']).toBeUndefined()
    expect(store.availablePlayerIDs).toContain('QB-1')
  })
})

describe('toggleManagedTeam', () => {
  it('flips the managed team and re-points the active team ref', () => {
    const store = useTeamsStore()
    store.setTeam(buildRoster({ team: { name: 'Homers' } }), 'Home')
    store.setTeam(buildRoster({ team: { name: 'Awayers' } }), 'Away')
    const before = store.getManagedTeam()
    store.toggleManagedTeam()
    const after = store.getManagedTeam()
    expect(after).not.toBe(before)
    expect(store.homeTeam).toBe('Homers')
    expect(store.awayTeam).toBe('Awayers')
  })
})
