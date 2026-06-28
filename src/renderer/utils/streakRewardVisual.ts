import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'

export type StreakTier = 'ember' | 'warm' | 'blaze' | 'legend'

export function getStreakTier(streakDays: number): StreakTier {
  if (streakDays >= 100) return 'legend'
  if (streakDays >= 31) return 'blaze'
  if (streakDays >= 8) return 'warm'
  return 'ember'
}

export function getStreakTierColor(tier: StreakTier): string {
  switch (tier) {
    case 'legend':
      return 'var(--streak-tier-legend, var(--gold-primary))'
    case 'blaze':
      return 'var(--streak-tier-blaze, var(--danger))'
    case 'warm':
      return 'var(--streak-tier-warm, var(--accent))'
    default:
      return 'var(--streak-tier-ember, var(--gold-primary))'
  }
}

/** Subtle scale for streak badge: day 1 → ~0.88, day 10 → ~1, day 100+ → ~1.28 */
export function getStreakDisplayScale(streakDays: number): number {
  if (streakDays <= 0) return 1
  const scale = 0.88 + Math.log10(Math.max(1, streakDays)) * 0.12
  return Math.min(1.28, Math.max(0.88, scale))
}

export function getChestCycleProgress(filledCount: number): {
  current: number
  total: number
  percent: number
} {
  const current = Math.min(DAILY_CHEST_STREAK_DAYS, Math.max(0, filledCount))
  return {
    current,
    total: DAILY_CHEST_STREAK_DAYS,
    percent: (current / DAILY_CHEST_STREAK_DAYS) * 100,
  }
}

/** Progress within the current 5-day reward cycle (for long streaks). */
export function getRewardCycleFillPercent(filledCount: number, streakDays: number): number {
  void streakDays
  return getChestCycleProgress(filledCount).percent
}
