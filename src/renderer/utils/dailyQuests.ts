/**
 * Daily Quests Utility Functions
 * Provides deterministic daily quest generation tied to local device time
 */

/**
 * Get local date string in YYYY-MM-DD format using device timezone
 * Uses getFullYear(), getMonth(), getDate() for local time (not UTC)
 */
export function getLocalDateStr(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generate a deterministic seed from date string
 * Seed = hash("YYYY-MM-DD")
 * Simple string hash function (djb2 variant)
 */
export function generateDailySeed(dateStr: string): number {
  let hash = 5381
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) & 0xFFFFFFFF
  }
  return Math.abs(hash)
}

/**
 * Seeded PRNG (Pseudo-Random Number Generator)
 * Uses Linear Congruential Generator (LCG) algorithm
 * Returns a deterministic random number between 0 and 1
 */
export function createSeededRandom(seed: number) {
  let state = seed
  return function () {
    // LCG parameters (same as glib's default)
    state = (1103515245 * state + 12345) & 0x7FFFFFFF
    return state / 0x7FFFFFFF
  }
}

/**
 * Deterministic shuffle using seeded PRNG
 * Same seed = same shuffle result every time
 * Uses Fisher-Yates algorithm with seeded random
 */
/**
 * Keep only completions for the current calendar day and today's daily roster.
 * Clears stale IDs after reset, day rollover, or daily quest regeneration.
 */
export function reconcileCompletedToday(
  completedToday: number[],
  dailyQuestIds: number[],
  lastDailyQuestDate: string,
  today: string = getLocalDateStr(),
): number[] {
  if (!lastDailyQuestDate || lastDailyQuestDate !== today || dailyQuestIds.length === 0) {
    return []
  }
  const dailySet = new Set(dailyQuestIds)
  return completedToday.filter((id) => dailySet.has(id))
}

/** How many of today's daily quest IDs appear in completedToday */
export function countDailyQuestsCompleted(dailyQuestIds: number[], completedToday: number[]): number {
  if (dailyQuestIds.length === 0) return 0
  const done = new Set(completedToday)
  return dailyQuestIds.filter((id) => done.has(id)).length
}

/** True when every daily quest ID is in completedToday */
export function areAllDailyQuestsCompleted(dailyQuestIds: number[], completedToday: number[]): boolean {
  return dailyQuestIds.length > 0 && dailyQuestIds.every((id) => completedToday.includes(id))
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const random = createSeededRandom(seed)

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }

  return result
}

/** Positive difference in calendar days (local noon) between two YYYY-MM-DD strings. */
export function calendarDaysBetween(isoFrom: string, isoTo: string): number {
  const a = new Date(isoFrom + 'T12:00:00')
  const b = new Date(isoTo + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/** Exactly one inactive day between last practice and today (e.g. Mon active, Tue missed, Wed today). */
export function shouldOfferStreakRecovery(lastActiveDate: string, today: string, currentStreak: number): boolean {
  if (!lastActiveDate || currentStreak <= 0) return false
  return calendarDaysBetween(lastActiveDate, today) === 2
}

export type StreakStateSlice = {
  lastActiveDate: string
  current: number
  longest: number
  streakRecoveryDueDate?: string
}

/**
 * Reset daily streak when the player missed more than one calendar day without completing all dailies.
 * A single missed day is handled via streak recovery (4 dailies) — not reset here.
 */
export function reconcileStreakOnDayRollover(
  streakState: StreakStateSlice,
  today: string,
): StreakStateSlice | null {
  if (!streakState.lastActiveDate || streakState.current <= 0) return null

  const gap = calendarDaysBetween(streakState.lastActiveDate, today)
  if (gap <= 1) return null
  if (gap === 2) return null

  return {
    ...streakState,
    current: 0,
    streakRecoveryDueDate: undefined,
  }
}

/** Count consecutive calendar days with at least one quest in the given category. */
export function countConsecutiveCategoryDays(
  logs: { completedAt: string; category?: string }[],
  category: string,
): number {
  const days = [
    ...new Set(
      logs
        .filter((l) => l.category === category)
        .map((l) => l.completedAt.slice(0, 10)),
    ),
  ].sort()

  if (days.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const gap = calendarDaysBetween(days[i - 1]!, days[i]!)
    if (gap === 1) {
      run++
      best = Math.max(best, run)
    } else if (gap > 0) {
      run = 1
    }
  }
  return best
}

/** Today's daily roster size: 4 when recovering a streak after one missed day, otherwise 3. */
export function resolveDailyQuestSlots(
  streak: { lastActiveDate: string; current: number; streakRecoveryDueDate?: string },
  today: string,
): number {
  if (streak.streakRecoveryDueDate === today) return 4
  if (shouldOfferStreakRecovery(streak.lastActiveDate, today, streak.current)) return 4
  return 3
}
