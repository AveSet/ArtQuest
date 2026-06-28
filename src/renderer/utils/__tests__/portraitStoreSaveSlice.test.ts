import { describe, it, expect } from 'vitest'
import { portraitStoreSaveFingerprint } from '../portraitStoreSaveSlice'

describe('portraitStoreSaveFingerprint', () => {
  it('tracks persisted portrait fields only', () => {
    const base = {
      dailyChestStreak: 2,
      lastDailyChestProgressDate: '2026-06-12',
      streakShieldUsedMonth: '',
      lastShieldUsedOnDate: '',
      pendingChestReveal: false,
      recordAllDailiesComplete: () => {},
      hydratePortrait: () => {},
      resetPortrait: () => {},
      isStreakShieldAvailable: () => true,
      consumeStreakShield: () => {},
      tryConsumeShieldForMissedDay: () => false,
      clearPendingChestReveal: () => {},
    }
    expect(portraitStoreSaveFingerprint(base)).toBe('2|2026-06-12||')
    expect(
      portraitStoreSaveFingerprint({ ...base, pendingChestReveal: true }),
    ).toBe(portraitStoreSaveFingerprint(base))
  })
})
