import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import PlayResult from './PlayResult.vue'
import { useGameStore } from '@/stores/gameStore'
import { useTeamsStore } from '@/stores/teamStore'
import { createTestVuetify } from '../../test/setup.js'
import { buildGameState } from '../../test/factories/gameState.js'

vi.mock('axios')

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.clearAllMocks()
})

function mountPlayResult() {
  const vuetify = createTestVuetify()
  return mount(PlayResult, {
    global: {
      plugins: [pinia, vuetify]
    }
  })
}

async function seedPlayResult({ result = {}, newState = {} } = {}) {
  const play = {
    result: {
      result_type: result.result_type,
      result: result.result,
      time: 5,
      details: [],
      mechanic: null,
      cards: null
    },
    new_state: {
      ...buildGameState(),
      play_counter: 1,
      ...newState
    }
  }
  axios.get.mockResolvedValueOnce({ data: [play] })
  const gameStore = useGameStore()
  await gameStore.fetchPlayResult()
}

describe('PlayResult.vue', () => {
  it('renders a favorable turnover as error color, alert-octagon icon, Turnover label', async () => {
    const teamsStore = useTeamsStore()
    await seedPlayResult({
      result: { result_type: 'TurnOver', result: 0 },
      newState: { possession: teamsStore.managedTeam }
    })
    const wrapper = mountPlayResult()
    expect(wrapper.text()).toContain('Turnover')
    const alert = wrapper.find('.v-alert')
    expect(alert.exists()).toBe(true)
    expect(alert.classes().join(' ')).toContain('error')
    expect(wrapper.find('.mdi-alert-octagon').exists()).toBe(true)
  })

  it('renders an unfavorable turnover as success color with the same icon/label', async () => {
    const teamsStore = useTeamsStore()
    const otherTeam = teamsStore.managedTeam === 'Home' ? 'Away' : 'Home'
    await seedPlayResult({
      result: { result_type: 'TurnOver', result: 0 },
      newState: { possession: otherTeam }
    })
    const wrapper = mountPlayResult()
    expect(wrapper.text()).toContain('Turnover')
    const alert = wrapper.find('.v-alert')
    expect(alert.exists()).toBe(true)
    expect(alert.classes().join(' ')).toContain('success')
    expect(wrapper.find('.mdi-alert-octagon').exists()).toBe(true)
  })

  it('renders a favorable positive-yardage completion as success color, arrow-up icon, yards shown', async () => {
    const teamsStore = useTeamsStore()
    await seedPlayResult({
      result: { result_type: 'Complete', result: 8 },
      newState: { possession: teamsStore.managedTeam }
    })
    const wrapper = mountPlayResult()
    expect(wrapper.text()).toContain('Complete')
    expect(wrapper.text()).toContain('8')
    const alert = wrapper.find('.v-alert')
    expect(alert.exists()).toBe(true)
    expect(alert.classes().join(' ')).toContain('success')
    expect(wrapper.find('.mdi-arrow-up-bold').exists()).toBe(true)
  })

  it('renders a zero/negative-yardage non-turnover with the football icon', async () => {
    const teamsStore = useTeamsStore()
    await seedPlayResult({
      result: { result_type: 'Incomplete', result: 0 },
      newState: { possession: teamsStore.managedTeam }
    })
    const wrapper = mountPlayResult()
    expect(wrapper.find('.mdi-football').exists()).toBe(true)
  })

  it('renders the empty-state card when the store has no play result yet', () => {
    const wrapper = mountPlayResult()
    expect(wrapper.text()).toContain('No play result available')
    expect(wrapper.find('.v-alert').exists()).toBe(false)
  })

  it('mounts with no unresolved-component or missing-global console warnings', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mountPlayResult()
    const badWarning = (call) =>
      /Failed to resolve component|inject\(\) can not be used/.test(call.join(' '))
    expect(warnSpy.mock.calls.some(badWarning)).toBe(false)
    expect(errorSpy.mock.calls.some(badWarning)).toBe(false)
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
