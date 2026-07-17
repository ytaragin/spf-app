import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import PlayTypeSelector from './PlayTypeSelector.vue'
import { useGameStore } from '@/stores/gameStore'
import { createTestVuetify } from '../../test/setup.js'

vi.mock('axios')

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.clearAllMocks()
  axios.get.mockResolvedValue({ data: { allowed_types: ['Run', 'Pass'], next_type: 'Run' } })
  axios.post.mockResolvedValue({ data: 'play type set' })
})

function mountSelector() {
  const vuetify = createTestVuetify()
  return mount(PlayTypeSelector, {
    global: {
      plugins: [pinia, vuetify]
    }
  })
}

describe('PlayTypeSelector.vue', () => {
  it('fetches play types on mount and renders a button for each returned type', async () => {
    const wrapper = mountSelector()
    await flushPromises()
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/game/nexttype'))
    expect(wrapper.text()).toContain('Run')
    expect(wrapper.text()).toContain('Pass')
  })

  it('renders the fetched nextPlayType in the "Next Play Type" chip', async () => {
    const wrapper = mountSelector()
    await flushPromises()
    const chipRegion = wrapper.find('.next-play-type')
    expect(chipRegion.exists()).toBe(true)
    expect(chipRegion.text()).toContain('Run')
  })

  it('clicking a play-type button dispatches setPlayType via axios.post', async () => {
    const wrapper = mountSelector()
    await flushPromises()
    const gameStore = useGameStore()

    const buttons = wrapper.findAll('button')
    const passButton = buttons.find((btn) => btn.text().includes('Pass'))
    expect(passButton).toBeTruthy()

    await passButton.trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/game/nexttype'),
      'Pass',
      expect.objectContaining({ headers: { 'Content-Type': 'text/plain' } })
    )
    expect(gameStore.gameMsg).toBe('play type set')
  })

  it('mounts with no unresolved-component or missing-global console warnings', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mountSelector()
    await flushPromises()
    const badWarning = (call) =>
      /Failed to resolve component|inject\(\) can not be used/.test(call.join(' '))
    expect(warnSpy.mock.calls.some(badWarning)).toBe(false)
    expect(errorSpy.mock.calls.some(badWarning)).toBe(false)
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
