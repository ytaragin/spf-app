import { describe, it, expect, vi, afterEach } from 'vitest'
import { dispatchEvent } from '@/game/gameEventDispatch.js'
import { buildGameState } from '../../test/factories/gameState.js'

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

  describe('variants deferred to plans 08-02 / 08-03', () => {
    const deferred = ['GameStarted', 'OffensiveLineupSet', 'DefensiveLineupSet', 'NextPlayTypeSet']

    for (const event of deferred) {
      it(`ignores ${event} for now and returns false`, () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = makeFakeStore()
        expect(dispatchEvent(store, { event, data: {} })).toBe(false)
        expect(store.calls).toHaveLength(0)
      })
    }
  })
})
