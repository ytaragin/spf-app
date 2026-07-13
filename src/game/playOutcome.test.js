import { describe, it, expect } from 'vitest'
import { outcomeColor, isTurnover } from '@/game/playOutcome.js'

describe('playOutcome', () => {
  it('colors a favorable positive-yardage completion as success', () => {
    expect(outcomeColor({ result_type: 'Complete', result: 8 })).toBe('success')
  })

  it('recognizes a turnover result', () => {
    expect(isTurnover({ result_type: 'TurnOver' })).toBe(true)
  })
})
