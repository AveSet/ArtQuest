import { describe, it, expect } from 'vitest'
import { advanceDailyChestProgress, DAILY_CHEST_STREAK_DAYS } from '../portraitChestProgress'

describe('advanceDailyChestProgress', () => {
  const base = {
    dailyChestStreak: 0,
    lastDailyChestProgressDate: '',
  }

  it('starts streak on first completion', () => {
    const result = advanceDailyChestProgress(base, '2026-05-20')
    expect(result.dailyChestStreak).toBe(1)
    expect(result.lastDailyChestProgressDate).toBe('2026-05-20')
    expect(result.streakCycleComplete).toBe(false)
  })

  it('increments streak on consecutive days', () => {
    const day4 = advanceDailyChestProgress(
      { ...base, dailyChestStreak: 3, lastDailyChestProgressDate: '2026-05-19' },
      '2026-05-20',
    )
    expect(day4.dailyChestStreak).toBe(4)
  })

  it('completes star cycle after five consecutive days', () => {
    const result = advanceDailyChestProgress(
      {
        ...base,
        dailyChestStreak: DAILY_CHEST_STREAK_DAYS - 1,
        lastDailyChestProgressDate: '2026-05-19',
      },
      '2026-05-20',
    )
    expect(result.streakCycleComplete).toBe(true)
    expect(result.dailyChestStreak).toBe(DAILY_CHEST_STREAK_DAYS)
  })

  it('continues streak with shield after one missed day', () => {
    const result = advanceDailyChestProgress(
      { ...base, dailyChestStreak: 3, lastDailyChestProgressDate: '2026-05-18' },
      '2026-05-20',
      { useStreakShield: true },
    )
    expect(result.dailyChestStreak).toBe(4)
    expect(result.usedStreakShield).toBe(true)
  })

  it('resets streak after a missed day', () => {
    const result = advanceDailyChestProgress(
      { ...base, dailyChestStreak: 4, lastDailyChestProgressDate: '2026-05-17' },
      '2026-05-20',
    )
    expect(result.dailyChestStreak).toBe(1)
  })

  it('does not double-count same calendar day', () => {
    const result = advanceDailyChestProgress(
      { ...base, dailyChestStreak: 2, lastDailyChestProgressDate: '2026-05-20' },
      '2026-05-20',
    )
    expect(result.dailyChestStreak).toBe(2)
    expect(result.streakCycleComplete).toBe(false)
  })
})
