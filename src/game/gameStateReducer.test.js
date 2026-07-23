import { describe, it, expect, vi } from 'vitest'
import { applyGameState } from '@/game/gameStateReducer.js'

describe('applyGameState', () => {
  it('applies a strictly newer play_counter, returning incoming (new reference)', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: 5 }
    const result = applyGameState(current, incoming)
    expect(result).toBe(incoming)
    expect(result).not.toBe(current)
  })

  it('rejects an equal play_counter, returning current by exact reference', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: 3 }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    spy.mockRestore()
  })

  it('rejects an older play_counter, returning current by exact reference', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: 2 }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    spy.mockRestore()
  })

  it('rejects an undefined play_counter, logging via console.error, never throwing', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: undefined }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => applyGameState(current, incoming)).not.toThrow()
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('rejects a NaN play_counter, logging via console.error, never throwing', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: Number('abc') }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => applyGameState(current, incoming)).not.toThrow()
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('rejects a null play_counter (treated as missing)', () => {
    const current = { play_counter: 3 }
    const incoming = { play_counter: null }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    spy.mockRestore()
  })

  it('rejects a null/undefined incoming, returning current, logging, never throwing', () => {
    const current = { play_counter: 3 }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => applyGameState(current, null)).not.toThrow()
    expect(() => applyGameState(current, undefined)).not.toThrow()
    expect(applyGameState(current, null)).toBe(current)
    expect(applyGameState(current, undefined)).toBe(current)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('bootstrap: current with no play_counter field always yields to valid incoming', () => {
    const current = { home_score: 0, away_score: 0 }
    const incoming = { play_counter: 1 }
    const result = applyGameState(current, incoming)
    expect(result).toBe(incoming)
  })

  it('bootstrap with invalid incoming: current unchanged (reject wins even in bootstrap)', () => {
    const current = {}
    const incoming = {}
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = applyGameState(current, incoming)
    expect(result).toBe(current)
    spy.mockRestore()
  })
})
