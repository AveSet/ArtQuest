import { calendarDaysBetween } from '@/utils/dailyQuests'

/** Consecutive daily-all-complete days to fill the reward star cycle on the dashboard. */
export const DAILY_CHEST_STREAK_DAYS = 5

export type DailyChestProgressInput = {
  dailyChestStreak: number
  lastDailyChestProgressDate: string
}

export type DailyChestProgressResult = DailyChestProgressInput & {
  streakCycleComplete: boolean
  usedStreakShield?: boolean
}

/** Call once per calendar day when all daily quests are completed. */
export function advanceDailyChestProgress(
  state: DailyChestProgressInput,
  today: string,
  options?: { useStreakShield?: boolean },
): DailyChestProgressResult {
  if (state.lastDailyChestProgressDate === today) {
    return { ...state, streakCycleComplete: false }
  }

  const gap = state.lastDailyChestProgressDate
    ? calendarDaysBetween(state.lastDailyChestProgressDate, today)
    : 0

  const continues =
    gap === 1 || (gap === 2 && Boolean(options?.useStreakShield))

  const nextStreak = continues ? state.dailyChestStreak + 1 : 1

  if (nextStreak >= DAILY_CHEST_STREAK_DAYS) {
    return {
      dailyChestStreak: DAILY_CHEST_STREAK_DAYS,
      lastDailyChestProgressDate: today,
      streakCycleComplete: true,
    }
  }

  return {
    dailyChestStreak: nextStreak,
    lastDailyChestProgressDate: today,
    streakCycleComplete: false,
    usedStreakShield: gap === 2 && Boolean(options?.useStreakShield),
  }
}
