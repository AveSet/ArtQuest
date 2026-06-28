import { describe, it, expect } from 'vitest'
import {
  shouldShowMistakeTags,
  shouldShowQualityRatings,
  pruneReflectionOnDifficultyChange,
  isSubmitReflectionValid,
} from '../questSubmitReflection'

describe('questSubmitReflection', () => {
  describe('shouldShowMistakeTags', () => {
    it('is false for difficulty 1-3', () => {
      expect(shouldShowMistakeTags(1)).toBe(false)
      expect(shouldShowMistakeTags(2)).toBe(false)
      expect(shouldShowMistakeTags(3)).toBe(false)
    })

    it('is true for difficulty 4-5', () => {
      expect(shouldShowMistakeTags(4)).toBe(true)
      expect(shouldShowMistakeTags(5)).toBe(true)
    })
  })

  describe('shouldShowQualityRatings', () => {
    it('is true for difficulty 1-3', () => {
      expect(shouldShowQualityRatings(1)).toBe(true)
      expect(shouldShowQualityRatings(2)).toBe(true)
      expect(shouldShowQualityRatings(3)).toBe(true)
    })

    it('is false for difficulty 4-5', () => {
      expect(shouldShowQualityRatings(4)).toBe(false)
      expect(shouldShowQualityRatings(5)).toBe(false)
    })
  })

  describe('pruneReflectionOnDifficultyChange', () => {
    it('clears mistake tags when moving from hard to easy', () => {
      const result = pruneReflectionOnDifficultyChange(
        5,
        2,
        { mistakeTags: ['line', 'proportion'], strengthRatings: { composition: 4 } },
      )
      expect(result.mistakeTags).toEqual([])
      expect(result.strengthRatings).toEqual({ composition: 4 })
    })

    it('clears strength ratings when moving from easy to hard', () => {
      const result = pruneReflectionOnDifficultyChange(
        2,
        5,
        { mistakeTags: [], strengthRatings: { line_confidence: 5, proportion: 4 } },
      )
      expect(result.strengthRatings).toEqual({})
      expect(result.mistakeTags).toEqual([])
    })

    it('keeps state when staying in the same band', () => {
      const state = { mistakeTags: ['line'], strengthRatings: {} as const }
      expect(pruneReflectionOnDifficultyChange(4, 5, state)).toEqual(state)
      const easy = { mistakeTags: [] as string[], strengthRatings: { composition: 3 as const } }
      expect(pruneReflectionOnDifficultyChange(2, 3, easy)).toEqual(easy)
    })
  })

  describe('isSubmitReflectionValid', () => {
    it('allows submit without mistake tags when difficulty <= 3', () => {
      expect(isSubmitReflectionValid(3, [])).toBe(true)
    })

    it('requires mistake tags when difficulty >= 4', () => {
      expect(isSubmitReflectionValid(4, [])).toBe(false)
      expect(isSubmitReflectionValid(5, [])).toBe(false)
      expect(isSubmitReflectionValid(4, ['line'])).toBe(true)
    })
  })
})
