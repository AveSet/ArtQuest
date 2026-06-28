import { describe, expect, it } from 'vitest'
import {
  getChestCycleProgress,
  getStreakDisplayScale,
  getStreakTier,
  getStreakTierColor,
} from '../streakRewardVisual'

describe('streakRewardVisual', () => {
  it('maps streak days to visual tiers', () => {
    expect(getStreakTier(3)).toBe('ember')
    expect(getStreakTier(12)).toBe('warm')
    expect(getStreakTier(45)).toBe('blaze')
    expect(getStreakTier(120)).toBe('legend')
  })

  it('grows display scale with longer streaks', () => {
    expect(getStreakDisplayScale(1)).toBeLessThan(getStreakDisplayScale(10))
    expect(getStreakDisplayScale(10)).toBeLessThan(getStreakDisplayScale(100))
    expect(getStreakDisplayScale(100)).toBeLessThanOrEqual(1.28)
  })

  it('computes chest cycle progress for the star row', () => {
    expect(getChestCycleProgress(2)).toEqual({ current: 2, total: 5, percent: 40 })
    expect(getChestCycleProgress(7)).toEqual({ current: 5, total: 5, percent: 100 })
  })

  it('returns tier colors', () => {
    expect(getStreakTierColor(getStreakTier(5))).toContain('var(--streak-tier-')
    expect(getStreakTierColor('legend')).toContain('var(--streak-tier-legend')
  })
})
