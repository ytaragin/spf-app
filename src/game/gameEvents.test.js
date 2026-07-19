import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseEvent } from '@/game/gameEvents.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('gameEvents', () => {
  describe('valid envelopes', () => {
    it('passes a PlayRun envelope through unchanged as { event, data }', () => {
      const raw = { event: 'PlayRun', data: { new_state: { play_counter: 3 } } }
      const result = parseEvent(raw)
      expect(result).toEqual({ event: 'PlayRun', data: { new_state: { play_counter: 3 } } })
    })

    it('does not add type/payload keys and leaves data untouched', () => {
      const result = parseEvent({ event: 'PlayRun', data: { x: 1 } })
      expect(result).toEqual({ event: 'PlayRun', data: { x: 1 } })
      expect(result).not.toHaveProperty('type')
      expect(result).not.toHaveProperty('payload')
    })

    it('accepts each of the 5 known variants', () => {
      const variants = [
        'GameStarted',
        'OffensiveLineupSet',
        'DefensiveLineupSet',
        'NextPlayTypeSet',
        'PlayRun'
      ]
      for (const event of variants) {
        expect(parseEvent({ event, data: {} })).toEqual({ event, data: {} })
      }
    })
  })

  describe('unknown variant', () => {
    it('returns null and logs via console.error including the offending tag', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(parseEvent({ event: 'Nope', data: {} })).toBeNull()
      expect(spy).toHaveBeenCalled()
      const message = spy.mock.calls[0].join(' ')
      expect(message).toContain('Nope')
    })

    it('does not dump the full stringified payload in the log', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      parseEvent({ event: 'Nope', data: { secret: 'top-secret-value' } })
      const message = spy.mock.calls[0].join(' ')
      expect(message).not.toContain('top-secret-value')
    })
  })

  describe('malformed inputs', () => {
    const cases = [
      ['null', null],
      ['undefined', undefined],
      ['a number', 42],
      ['a string', 'string'],
      ['missing event', {}],
      ['non-string event', { event: 123, data: {} }],
      ['missing data', { event: 'PlayRun' }]
    ]

    for (const [label, input] of cases) {
      it(`returns null and never throws for ${label}`, () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => parseEvent(input)).not.toThrow()
        expect(parseEvent(input)).toBeNull()
      })
    }
  })
})
