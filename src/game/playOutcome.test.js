import { describe, it, expect } from 'vitest'
import {
  outcomeColor,
  isTurnover,
  netYards,
  outcomeIcon,
  outcomeLabel,
  outcomeSummary,
  classifyOutcome,
  managedTeamHadPossession
} from '@/game/playOutcome.js'

describe('playOutcome', () => {
  it('colors a favorable positive-yardage completion as success', () => {
    expect(outcomeColor({ result_type: 'Complete', result: 8 })).toBe('success')
  })

  it('recognizes a turnover result', () => {
    expect(isTurnover({ result_type: 'TurnOver' })).toBe(true)
  })

  describe('isTurnover', () => {
    it('returns false for a non-turnover result_type', () => {
      expect(isTurnover({ result_type: 'Complete' })).toBe(false)
    })
  })

  describe('netYards', () => {
    it('returns the numeric result value', () => {
      expect(netYards({ result: 8 })).toBe(8)
    })

    it('returns 0 for a non-numeric result', () => {
      expect(netYards({ result: 'abc' })).toBe(0)
    })
  })

  describe('outcomeIcon', () => {
    it('returns the alert icon for a turnover', () => {
      expect(outcomeIcon({ result_type: 'TurnOver', result: 0 })).toBe('mdi-alert-octagon')
    })

    it('returns the arrow-up icon for positive yardage non-turnover', () => {
      expect(outcomeIcon({ result_type: 'Complete', result: 5 })).toBe('mdi-arrow-up-bold')
    })

    it('returns the football icon for zero/negative yardage non-turnover', () => {
      expect(outcomeIcon({ result_type: 'Incomplete', result: 0 })).toBe('mdi-football')
    })
  })

  describe('outcomeLabel', () => {
    it('returns Turnover for a turnover result', () => {
      expect(outcomeLabel({ result_type: 'TurnOver' })).toBe('Turnover')
    })

    it('returns the raw result_type for a non-turnover result', () => {
      expect(outcomeLabel({ result_type: 'Complete' })).toBe('Complete')
    })
  })

  describe('outcomeSummary', () => {
    it('returns Turnover - {n} yards for a turnover', () => {
      expect(outcomeSummary({ result_type: 'TurnOver', result: -3 })).toBe('Turnover - -3 yards')
    })

    it('returns {result_type} - {n} yards for a non-turnover', () => {
      expect(outcomeSummary({ result_type: 'Complete', result: 8 })).toBe('Complete - 8 yards')
    })
  })

  describe('outcomeColor', () => {
    describe('favorable: true (default)', () => {
      it('colors a positive-yardage non-turnover as success', () => {
        expect(outcomeColor({ result_type: 'Complete', result: 8 })).toBe('success')
      })

      it('colors a turnover as error', () => {
        expect(outcomeColor({ result_type: 'TurnOver', result: 0 })).toBe('error')
      })
    })

    describe('favorable: false', () => {
      it('colors a positive-yardage non-turnover as error', () => {
        expect(outcomeColor({ result_type: 'Complete', result: 8 }, { favorable: false })).toBe(
          'error'
        )
      })

      it('colors a turnover as success', () => {
        expect(outcomeColor({ result_type: 'TurnOver', result: 0 }, { favorable: false })).toBe(
          'success'
        )
      })
    })
  })

  describe('classifyOutcome', () => {
    it('returns all five keys populated consistently', () => {
      expect(classifyOutcome({ result_type: 'Complete', result: 8 })).toEqual({
        color: 'success',
        icon: 'mdi-arrow-up-bold',
        label: 'Complete',
        summary: 'Complete - 8 yards',
        isTurnover: false,
        netYards: 8
      })
    })
  })

  describe('managedTeamHadPossession', () => {
    it('returns true when possession matches the managed team', () => {
      expect(managedTeamHadPossession({ new_state: { possession: 'Home' } }, 'Home')).toBe(true)
    })

    it('returns false when possession does not match the managed team', () => {
      expect(managedTeamHadPossession({ new_state: { possession: 'Away' } }, 'Home')).toBe(false)
    })
  })
})
