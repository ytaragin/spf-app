import { describe, it, expect } from 'vitest'
import { SPFMetadata } from '@/game/SPFMetadata.js'

describe('SPFMetadata', () => {
  const meta = new SPFMetadata()

  describe('getBoxLabel', () => {
    it('returns the label for a working box_* key', () => {
      expect(meta.getBoxLabel('box_a')).toBe('Box A')
    })
  })

  describe('getPositionForABox', () => {
    it('returns defRow1 positions for box_a', () => {
      expect(meta.getPositionForABox('box_a')).toEqual(['DL', 'LB'])
    })

    it('returns defRow2 positions for box_f', () => {
      expect(meta.getPositionForABox('box_f')).toEqual(['LB'])
    })

    it('returns defRow3 positions for box_k', () => {
      expect(meta.getPositionForABox('box_k')).toEqual(['DB'])
    })

    it('returns defRow3BoxL positions for box_l', () => {
      expect(meta.getPositionForABox('box_l')).toEqual(['DB'])
      expect(meta.getPositionMetaData('box_l')).toEqual({
        positions: ['DB'],
        allowMultiple: true
      })
    })
  })

  describe('getPositionMetaData', () => {
    it('returns the full metadata object for box_a', () => {
      expect(meta.getPositionMetaData('box_a')).toEqual({
        positions: ['DL', 'LB'],
        allowMultiple: true
      })
    })
  })

  describe('getOffensivePlayNames', () => {
    it('returns all 9 offensive play keys', () => {
      const names = meta.getOffensivePlayNames()
      expect(names).toHaveLength(9)
      expect(names).toContain('InsideRun')
      expect(names).toContain('LongPass')
    })
  })

  describe('getDefensivePlayNames', () => {
    it('returns all 4 defensive play keys', () => {
      const names = meta.getDefensivePlayNames()
      expect(names).toHaveLength(4)
      expect(names).toEqual(['RunDefense', 'PassDefense', 'PreventDefense', 'Blitz'])
    })
  })

  describe('getOffensePlayInfo', () => {
    it('returns play info for InsideLeft', () => {
      const info = meta.getOffensePlayInfo('InsideLeft')
      expect(info.code).toBe('IL')
      expect(info.description).toContain('Inside Left')
      expect(info.boxes).toEqual(['b1', 'b2', 'b3'])
    })

    it('returns null when called with no play', () => {
      expect(meta.getOffensePlayInfo(null)).toBe(null)
    })

    it('does not assert code for InsideRun (D-07 bug)', () => {
      const info = meta.getOffensePlayInfo('InsideRun')
      expect(info.description).toBe('Running, Inside Right [IR]')
      expect(info.boxes).toEqual(['b1', 'b2', 'b3'])
    })

    it('does not assert code for InsideRight (D-07 bug)', () => {
      const info = meta.getOffensePlayInfo('InsideRight')
      expect(info.description).toBe('Running, Sweep Right [IR]')
      expect(info.boxes).toEqual(['b1', 'b2', 'b3'])
    })
  })

  describe('getDefensePlayInfo', () => {
    it('returns play info for Blitz', () => {
      const info = meta.getDefensePlayInfo('Blitz')
      expect(info.code).toBe('Blitz')
      expect(info.description).toBe('Pass - Blitz Defense')
      expect(info.boxes).toContain('le')
      expect(info.boxes).toContain('re')
    })
  })

  describe('getRelatedPassDefenseBox', () => {
    it('returns the defended box for a box that guards another', () => {
      expect(meta.getRelatedPassDefenseBox('re')).toBe('box_n')
    })

    it('returns the guarding box for a box that is guarded', () => {
      expect(meta.getRelatedPassDefenseBox('box_n')).toBe('re')
    })

    it('returns null for a box with no pass-defense relationship', () => {
      expect(meta.getRelatedPassDefenseBox('box_a')).toBe(null)
    })
  })

  describe('getBoxLayoutForPlay', () => {
    it('returns kickoff boxes for the kickoff branch', () => {
      expect(meta.getBoxLayoutForPlay('kickoff')).toEqual({
        offense: [['k']],
        defense: [['kr']]
      })
    })

    it('matches the kickoff branch case-insensitively', () => {
      expect(meta.getBoxLayoutForPlay('KICKOFF')).toEqual({
        offense: [['k']],
        defense: [['kr']]
      })
    })

    it('returns standard offense/defense layouts for the default branch', () => {
      const layout = meta.getBoxLayoutForPlay('InsideRun')
      expect(layout).toHaveProperty('offense')
      expect(layout).toHaveProperty('defense')
      expect(layout.offense[0]).toContain('le')
    })
  })
})
