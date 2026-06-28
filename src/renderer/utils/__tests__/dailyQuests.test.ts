import { describe, it, expect } from 'vitest'
import {
  getLocalDateStr,
  generateDailySeed,
  createSeededRandom,
  seededShuffle,
  countDailyQuestsCompleted,
  areAllDailyQuestsCompleted,
  reconcileCompletedToday,
  calendarDaysBetween,
  shouldOfferStreakRecovery,
  resolveDailyQuestSlots,
  reconcileStreakOnDayRollover,
  countConsecutiveCategoryDays,
} from '../dailyQuests'

describe('dailyQuests', () => {
  describe('getLocalDateStr', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = getLocalDateStr()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('generateDailySeed', () => {
    it('returns same seed for same date', () => {
      expect(generateDailySeed('2026-05-11')).toBe(generateDailySeed('2026-05-11'))
    })

    it('returns different seeds for different dates', () => {
      expect(generateDailySeed('2026-05-11')).not.toBe(generateDailySeed('2026-05-12'))
    })

    it('returns a positive number', () => {
      expect(generateDailySeed('2026-05-11')).toBeGreaterThan(0)
    })
  })

  describe('createSeededRandom', () => {
    it('produces deterministic sequence for same seed', () => {
      const rng1 = createSeededRandom(42)
      const rng2 = createSeededRandom(42)
      const seq1 = [rng1(), rng1(), rng1()]
      const seq2 = [rng2(), rng2(), rng2()]
      expect(seq1).toEqual(seq2)
    })

    it('returns values between 0 and 1', () => {
      const rng = createSeededRandom(12345)
      for (let i = 0; i < 100; i++) {
        const val = rng()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('daily progress helpers', () => {
    it('counts only daily IDs in completedToday', () => {
      expect(countDailyQuestsCompleted([1, 2, 3], [99, 1, 88, 2])).toBe(2)
    })

    it('areAllDailyQuestsCompleted ignores extra completions', () => {
      expect(areAllDailyQuestsCompleted([1, 2, 3], [99, 1, 2, 3])).toBe(true)
    })

    it('areAllDailyQuestsCompleted is false when a daily is missing', () => {
      expect(areAllDailyQuestsCompleted([1, 2, 3], [1, 2, 99])).toBe(false)
    })

    it('does not treat equal-length unrelated lists as complete', () => {
      expect(areAllDailyQuestsCompleted([1, 2, 3], [99, 88, 77])).toBe(false)
    })

    it('reconcileCompletedToday clears stale IDs after roster change', () => {
      expect(
        reconcileCompletedToday([1, 2], [4, 5, 6], '2026-05-19', '2026-05-19'),
      ).toEqual([])
    })

    it('reconcileCompletedToday clears completions from a previous day', () => {
      expect(
        reconcileCompletedToday([1, 2, 3], [1, 2, 3], '2026-05-18', '2026-05-19'),
      ).toEqual([])
    })

    it('reconcileCompletedToday keeps valid same-day daily completions', () => {
      expect(
        reconcileCompletedToday([1, 99, 2], [1, 2, 3], '2026-05-19', '2026-05-19'),
      ).toEqual([1, 2])
    })
  })

  describe('calendar & streak recovery slots', () => {
    it('calendarDaysBetween counts days between local midnights', () => {
      expect(calendarDaysBetween('2026-05-15', '2026-05-17')).toBe(2)
      expect(calendarDaysBetween('2026-05-16', '2026-05-17')).toBe(1)
    })

    it('shouldOfferStreakRecovery requires one skipped day and active streak', () => {
      expect(shouldOfferStreakRecovery('2026-05-15', '2026-05-17', 3)).toBe(true)
      expect(shouldOfferStreakRecovery('2026-05-15', '2026-05-17', 0)).toBe(false)
      expect(shouldOfferStreakRecovery('', '2026-05-17', 3)).toBe(false)
      expect(shouldOfferStreakRecovery('2026-05-16', '2026-05-17', 3)).toBe(false)
    })

    it('resolveDailyQuestSlots returns 4 for recovery or active recovery date', () => {
      const today = '2026-05-17'
      expect(resolveDailyQuestSlots({ lastActiveDate: '2026-05-15', current: 3 }, today)).toBe(4)
      expect(
        resolveDailyQuestSlots(
          { lastActiveDate: '2026-05-10', current: 3, streakRecoveryDueDate: today },
          today,
        ),
      ).toBe(4)
      expect(resolveDailyQuestSlots({ lastActiveDate: '2026-05-16', current: 3 }, today)).toBe(3)
    })

    it('reconcileStreakOnDayRollover resets streak after multiple missed days', () => {
      const base = { lastActiveDate: '2026-05-10', current: 5, longest: 10 }
      expect(reconcileStreakOnDayRollover(base, '2026-05-13')).toEqual({
        ...base,
        current: 0,
        streakRecoveryDueDate: undefined,
      })
      expect(reconcileStreakOnDayRollover(base, '2026-05-12')).toBeNull()
      expect(reconcileStreakOnDayRollover(base, '2026-05-11')).toBeNull()
    })

    it('countConsecutiveCategoryDays counts calendar days not log entries', () => {
      const logs = [
        { completedAt: '2026-05-10T10:00:00.000Z', category: 'drawing' },
        { completedAt: '2026-05-10T18:00:00.000Z', category: 'drawing' },
        { completedAt: '2026-05-11T10:00:00.000Z', category: 'drawing' },
        { completedAt: '2026-05-13T10:00:00.000Z', category: 'drawing' },
      ]
      expect(countConsecutiveCategoryDays(logs, 'drawing')).toBe(2)
    })
  })

  describe('seededShuffle', () => {
    it('returns same order for same seed', () => {
      const arr = [1, 2, 3, 4, 5]
      expect(seededShuffle(arr, 42)).toEqual(seededShuffle(arr, 42))
    })

    it('produces different order for different seeds', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8]
      const s1 = seededShuffle(arr, 42)
      const s2 = seededShuffle(arr, 99)
      expect(s1).not.toEqual(s2)
    })

    it('does not mutate original array', () => {
      const arr = [1, 2, 3]
      const copy = [...arr]
      seededShuffle(arr, 42)
      expect(arr).toEqual(copy)
    })

    it('preserves all elements', () => {
      const arr = [10, 20, 30, 40]
      const result = seededShuffle(arr, 7)
      expect(result.sort()).toEqual(arr.sort())
    })
  })
})
