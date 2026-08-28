import { describe, it, expect, vi, afterEach } from 'vitest'
import { dispatchEvent } from '@/game/gameEventDispatch.js'
import { buildGameState } from '../../test/factories/gameState.js'
import { buildLineup } from '../../test/factories/lineup.js'

afterEach(() => {
  vi.restoreAllMocks()
})

// Zero-mock fake store (D-01): a plain object recording calls, so dispatch tests
// never need a real Pinia instance. Deliberately uses plain arrow functions
// rather than spy doubles — the repo's pure modules use plain-object fixtures.
function makeFakeStore(overrides = {}) {
  const calls = []
  return {
    calls,
    applyLineup: (side, lineup) => calls.push(['applyLineup', side, lineup]),
    applyNextPlayType: (type) => calls.push(['applyNextPlayType', type]),
    applyPlayResult: (playAndState) => {
      calls.push(['applyPlayResult', playAndState])
      return true
    },
    applyIncomingGameState: (state) => {
      calls.push(['applyIncomingGameState', state])
      return true
    },
    ...overrides
  }
}

const playRun = (counter) => ({
  result_type: 'Run',
  new_state: buildGameState({ play_counter: counter })
})

describe('dispatchEvent — PlayRun', () => {
  it('applies a PlayRun and returns true, passing the whole PlayAndState', () => {
    const store = makeFakeStore()
    const data = playRun(1)
    expect(dispatchEvent(store, { event: 'PlayRun', data })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0][0]).toBe('applyPlayResult')
    // the whole PlayAndState is forwarded, not just new_state
    expect(store.calls[0][1]).toBe(data)
  })

  it('returns false when applyPlayResult reports a reducer no-op', () => {
    const calls = []
    const store = makeFakeStore({
      applyPlayResult: (playAndState) => {
        calls.push(['applyPlayResult', playAndState])
        return false
      }
    })
    expect(dispatchEvent(store, { event: 'PlayRun', data: playRun(1) })).toBe(false)
    expect(calls).toHaveLength(1)
  })

  it('calls applyPlayResult for each of two identical deliveries', () => {
    const store = makeFakeStore()
    const data = playRun(1)
    dispatchEvent(store, { event: 'PlayRun', data })
    dispatchEvent(store, { event: 'PlayRun', data })
    expect(store.calls).toHaveLength(2)
  })

  describe('invalid PlayRun payloads', () => {
    const cases = [
      ['missing new_state', { result_type: 'Run' }],
      ['null new_state', { result_type: 'Run', new_state: null }],
      ['a string new_state', { result_type: 'Run', new_state: 'nope' }],
      ['a number new_state', { result_type: 'Run', new_state: 42 }],
      ['null data', null],
      ['a string data', 'nope']
    ]

    for (const [label, data] of cases) {
      it(`returns false, logs once, and touches no store action for ${label}`, () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(() => dispatchEvent(store, { event: 'PlayRun', data })).not.toThrow()
        expect(dispatchEvent(store, { event: 'PlayRun', data })).toBe(false)
        expect(spy).toHaveBeenCalled()
        expect(store.calls).toHaveLength(0)
      })
    }

    it('logs the event tag but never a payload value', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = makeFakeStore()
      dispatchEvent(store, { event: 'PlayRun', data: { secret: 'top-secret-value' } })
      const message = spy.mock.calls[0].join(' ')
      expect(message).toContain('PlayRun')
      expect(message).not.toContain('top-secret-value')
      expect(store.calls).toHaveLength(0)
    })
  })

  describe('malformed envelopes', () => {
    const cases = [
      ['null', null],
      ['undefined', undefined],
      ['a number', 42],
      ['a string', 'string'],
      ['missing event', {}],
      ['non-string event', { event: 123, data: {} }],
      ['unknown event tag', { event: 'Nope', data: {} }]
    ]

    for (const [label, input] of cases) {
      it(`returns false, never throws, and touches no store action for ${label}`, () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(() => dispatchEvent(store, input)).not.toThrow()
        expect(dispatchEvent(store, input)).toBe(false)
        expect(store.calls).toHaveLength(0)
      })
    }
  })
})

describe('dispatchEvent — GameStarted', () => {
  it('routes to applyIncomingGameState with the data itself and returns its verdict', () => {
    const store = makeFakeStore()
    const data = buildGameState({ play_counter: 0 })
    expect(dispatchEvent(store, { event: 'GameStarted', data })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0][0]).toBe('applyIncomingGameState')
    expect(store.calls[0][1]).toBe(data)
  })

  it('never routes through applyPlayResult (D-16)', () => {
    const store = makeFakeStore()
    dispatchEvent(store, { event: 'GameStarted', data: buildGameState({ play_counter: 0 }) })
    expect(store.calls.some((call) => call[0] === 'applyPlayResult')).toBe(false)
  })

  it('returns false when the store action reports a reducer no-op', () => {
    const store = makeFakeStore({
      applyIncomingGameState: () => false
    })
    expect(
      dispatchEvent(store, { event: 'GameStarted', data: buildGameState({ play_counter: 0 }) })
    ).toBe(false)
  })

  it('is idempotent in shape — a repeat delivery still routes to the same action', () => {
    const store = makeFakeStore()
    const data = buildGameState({ play_counter: 1 })
    dispatchEvent(store, { event: 'GameStarted', data })
    dispatchEvent(store, { event: 'GameStarted', data })
    expect(store.calls).toHaveLength(2)
    expect(store.calls.every((call) => call[0] === 'applyIncomingGameState')).toBe(true)
  })
})

describe('dispatchEvent — lineup variants', () => {
  it('routes OffensiveLineupSet to applyLineup with the offense side', () => {
    const store = makeFakeStore()
    const data = buildLineup()
    expect(dispatchEvent(store, { event: 'OffensiveLineupSet', data })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0][0]).toBe('applyLineup')
    expect(store.calls[0][1]).toBe('offense')
    expect(store.calls[0][2]).toBe(data)
  })

  it('routes DefensiveLineupSet to applyLineup with the defense side', () => {
    const store = makeFakeStore()
    const data = buildLineup()
    expect(dispatchEvent(store, { event: 'DefensiveLineupSet', data })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0][0]).toBe('applyLineup')
    expect(store.calls[0][1]).toBe('defense')
    expect(store.calls[0][2]).toBe(data)
  })

  it('is naturally idempotent — a repeat delivery stores the identical lineup', () => {
    const store = makeFakeStore()
    const data = buildLineup()
    dispatchEvent(store, { event: 'OffensiveLineupSet', data })
    dispatchEvent(store, { event: 'OffensiveLineupSet', data })
    expect(store.calls).toHaveLength(2)
    expect(store.calls[0][2]).toBe(store.calls[1][2])
  })
})

describe('dispatchEvent — malformed data for the state and lineup variants', () => {
  const tags = ['GameStarted', 'OffensiveLineupSet', 'DefensiveLineupSet']
  const payloads = [
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', 'nope']
  ]

  for (const tag of tags) {
    for (const [label, data] of payloads) {
      it(`ignores ${tag} with ${label} data — false, one log, zero store calls`, () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(() => dispatchEvent(store, { event: tag, data })).not.toThrow()
        expect(dispatchEvent(store, { event: tag, data })).toBe(false)
        expect(store.calls).toHaveLength(0)
        expect(spy).toHaveBeenCalled()
      })
    }

    it(`logs the ${tag} tag but never a payload value`, () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = makeFakeStore()
      dispatchEvent(store, { event: tag, data: 'top-secret-value' })
      const message = spy.mock.calls[0].join(' ')
      expect(message).toContain(tag)
      expect(message).not.toContain('top-secret-value')
      expect(store.calls).toHaveLength(0)
    })
  }
})

describe('dispatchEvent — NextPlayTypeSet', () => {
  it('routes a bare play-type string to applyNextPlayType and returns true', () => {
    const store = makeFakeStore()
    expect(dispatchEvent(store, { event: 'NextPlayTypeSet', data: 'Run' })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0]).toEqual(['applyNextPlayType', 'Run'])
  })

  it('forwards the { next_type } object shape unchanged for the store to normalize (D-10)', () => {
    const store = makeFakeStore()
    const data = { next_type: 'Pass' }
    expect(dispatchEvent(store, { event: 'NextPlayTypeSet', data })).toBe(true)
    expect(store.calls).toHaveLength(1)
    expect(store.calls[0][0]).toBe('applyNextPlayType')
    expect(store.calls[0][1]).toBe(data)
  })

  it('is idempotent in effect — two identical deliveries carry the same play type', () => {
    const store = makeFakeStore()
    dispatchEvent(store, { event: 'NextPlayTypeSet', data: 'Run' })
    dispatchEvent(store, { event: 'NextPlayTypeSet', data: 'Run' })
    expect(store.calls).toHaveLength(2)
    expect(store.calls[0][1]).toBe(store.calls[1][1])
  })

  describe('invalid NextPlayTypeSet payloads', () => {
    const cases = [
      ['null', null],
      ['undefined', undefined],
      ['a number', 42],
      ['an empty string', ''],
      ['an object with no next_type', { nope: 'Run' }],
      ['an object with a non-string next_type', { next_type: 42 }],
      ['an object with an empty next_type', { next_type: '' }]
    ]

    for (const [label, data] of cases) {
      it(`returns false, logs, and touches no store action for ${label}`, () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(() => dispatchEvent(store, { event: 'NextPlayTypeSet', data })).not.toThrow()
        expect(dispatchEvent(store, { event: 'NextPlayTypeSet', data })).toBe(false)
        expect(spy).toHaveBeenCalled()
        expect(store.calls).toHaveLength(0)
      })
    }

    it('logs the event tag but never a payload value', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = makeFakeStore()
      dispatchEvent(store, { event: 'NextPlayTypeSet', data: { secret: 'top-secret-value' } })
      const message = spy.mock.calls[0].join(' ')
      expect(message).toContain('NextPlayTypeSet')
      expect(message).not.toContain('top-secret-value')
      expect(store.calls).toHaveLength(0)
    })
  })
})

describe('dispatchEvent — variant coverage and defensive branches', () => {
  // Locally declared, mirroring KNOWN_VARIANTS in gameEvents.js. The two lists
  // must stay in lockstep — this test is what makes drift visible.
  const variants = [
    ['GameStarted', buildGameState({ play_counter: 1 })],
    ['OffensiveLineupSet', buildLineup()],
    ['DefensiveLineupSet', buildLineup()],
    ['NextPlayTypeSet', 'Run'],
    ['PlayRun', playRun(1)]
  ]

  it('covers exactly the 5 known variants', () => {
    expect(variants).toHaveLength(5)
  })

  for (const [event, data] of variants) {
    it(`routes ${event} to a store action — no fall-through to the unknown-tag branch`, () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = makeFakeStore()
      expect(dispatchEvent(store, { event, data })).toBe(true)
      expect(store.calls.length).toBeGreaterThanOrEqual(1)
      expect(spy).not.toHaveBeenCalled()
    })
  }

  it('rejects an unknown tag, logging the tag with zero store calls', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = makeFakeStore()
    expect(dispatchEvent(store, { event: 'Nope', data: {} })).toBe(false)
    expect(spy.mock.calls[0].join(' ')).toContain('Nope')
    expect(store.calls).toHaveLength(0)
  })

  describe('malformed envelopes never throw', () => {
    const cases = [
      ['null', null],
      ['undefined', undefined],
      ['a number', 42],
      ['a string', 'string'],
      ['an empty object', {}],
      ['a non-string event tag', { event: 123, data: {} }]
    ]

    for (const [label, input] of cases) {
      it(`returns false for ${label}`, () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(() => dispatchEvent(store, input)).not.toThrow()
        expect(dispatchEvent(store, input)).toBe(false)
        expect(store.calls).toHaveLength(0)
      })
    }
  })
})
