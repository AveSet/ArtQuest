import type { Quest, QuestCompletionLog } from '@/store/models'
import { calendarDaysBetween, getLocalDateStr } from '@/utils/dailyQuests'

export type QuestReviewEntry = {
  nextReviewAt: string
  intervalDays: number
  easeFactor: number
}

function daysBetween(a: string, b: string): number {
  return calendarDaysBetween(a.slice(0, 10), b.slice(0, 10))
}

function addLocalCalendarDays(dateLike: string, days: number): string {
  const date = new Date(`${dateLike.slice(0, 10)}T12:00:00`)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Quests due for spaced review from schedule and/or legacy review_after_days + logs. */
export function getQuestsDueForReview(
  schedule: Record<string, QuestReviewEntry>,
  logs: QuestCompletionLog[],
  quests: Quest[],
  today = getLocalDateStr(),
): Quest[] {
  const questMap = new Map(quests.map((q) => [q.id, q]))
  const lastCompleted = new Map<number, string>()

  for (const log of logs) {
    const prev = lastCompleted.get(log.questId)
    if (!prev || log.completedAt > prev) {
      lastCompleted.set(log.questId, log.completedAt)
    }
  }

  const dueIds = new Set<number>()

  for (const [key, entry] of Object.entries(schedule)) {
    const questId = Number(key)
    if (!Number.isFinite(questId) || !questMap.has(questId)) continue
    if (entry.nextReviewAt.slice(0, 10) <= today) dueIds.add(questId)
  }

  for (const quest of quests) {
    if (dueIds.has(quest.id)) continue
    const reviewDays = quest.review_after_days ?? 0
    if (reviewDays <= 0) continue
    if (schedule[String(quest.id)]) continue
    const completedAt = lastCompleted.get(quest.id)
    if (!completedAt) continue
    const elapsed = daysBetween(completedAt.slice(0, 10), today)
    if (elapsed >= reviewDays) dueIds.add(quest.id)
  }

  const due: Quest[] = []
  for (const id of dueIds) {
    const quest = questMap.get(id)
    if (quest) due.push(quest)
  }

  return due.sort((a, b) => (b.review_after_days ?? 0) - (a.review_after_days ?? 0))
}

export const MIN_REVIEW_EASE_FACTOR = 1.3
export const REVIEW_EASE_DECREASE_ON_MISS = 0.2

/** Decrease easeFactor for overdue review entries (SM-2 failure path). */
export function penalizeMissedReviews(
  schedule: Record<string, QuestReviewEntry>,
  today: string,
): Record<string, QuestReviewEntry> {
  let changed = false
  const next: Record<string, QuestReviewEntry> = { ...schedule }

  for (const [key, entry] of Object.entries(next)) {
    if (entry.nextReviewAt.slice(0, 10) >= today) continue
    changed = true
    next[key] = {
      ...entry,
      easeFactor: Math.max(
        MIN_REVIEW_EASE_FACTOR,
        Math.round((entry.easeFactor - REVIEW_EASE_DECREASE_ON_MISS) * 100) / 100,
      ),
      nextReviewAt: today,
    }
  }

  return changed ? next : schedule
}

export const SOFT_RESCHEDULE_PRIORITY_COUNT = 3
export const SOFT_RESCHEDULE_SPREAD_DAYS = 14

/**
 * After a long absence, keep the top priority reviews due today and spread the rest
 * across the next two weeks to avoid a demotivating review wall.
 */
export function softRescheduleOverdueReviews(
  schedule: Record<string, QuestReviewEntry>,
  quests: Quest[],
  today: string,
): Record<string, QuestReviewEntry> | null {
  const questMap = new Map(quests.map((q) => [q.id, q]))
  const overdue: Array<{ key: string; entry: QuestReviewEntry; xp: number }> = []

  for (const [key, entry] of Object.entries(schedule)) {
    if (entry.nextReviewAt.slice(0, 10) > today) continue
    const questId = Number(key)
    overdue.push({ key, entry, xp: questMap.get(questId)?.xp ?? 0 })
  }

  if (overdue.length <= SOFT_RESCHEDULE_PRIORITY_COUNT) return null

  overdue.sort((a, b) => a.entry.easeFactor - b.entry.easeFactor || b.xp - a.xp)
  const next: Record<string, QuestReviewEntry> = { ...schedule }
  let changed = false
  const tailCount = overdue.length - SOFT_RESCHEDULE_PRIORITY_COUNT

  overdue.forEach((row, index) => {
    if (index < SOFT_RESCHEDULE_PRIORITY_COUNT) {
      if (row.entry.nextReviewAt.slice(0, 10) !== today) {
        next[row.key] = { ...row.entry, nextReviewAt: today }
        changed = true
      }
      return
    }
    const tailIndex = index - SOFT_RESCHEDULE_PRIORITY_COUNT
    const dayOffset =
      1 +
      Math.floor((tailIndex * SOFT_RESCHEDULE_SPREAD_DAYS) / Math.max(1, tailCount))
    const nextDate = addLocalCalendarDays(today, dayOffset)
    if (row.entry.nextReviewAt.slice(0, 10) !== nextDate) {
      next[row.key] = { ...row.entry, nextReviewAt: nextDate }
      changed = true
    }
  })

  return changed ? next : null
}

/** SM-2-lite: schedule next review after a successful repeat. */
export function scheduleNextReview(
  schedule: Record<string, QuestReviewEntry>,
  questId: number,
  reviewAfterDays: number,
  completedAt: string,
): Record<string, QuestReviewEntry> {
  const key = String(questId)
  const prev = schedule[key]
  const ease = prev?.easeFactor ?? 2.5
  const interval = prev ? Math.round(prev.intervalDays * ease) : reviewAfterDays
  const nextDays = Math.max(reviewAfterDays, Math.min(interval, 90))
  return {
    ...schedule,
    [key]: {
      nextReviewAt: addLocalCalendarDays(completedAt, nextDays),
      intervalDays: nextDays,
      easeFactor: Math.min(ease + 0.1, 3.0),
    },
  }
}

export function pickReviewQuestForDaily(
  dueQuests: Quest[],
  completedToday: number[],
  seed: number,
): number | undefined {
  const pool = dueQuests.filter((q) => !completedToday.includes(q.id))
  if (pool.length === 0) return undefined
  const idx = Math.abs(seed) % pool.length
  return pool[idx]?.id
}
