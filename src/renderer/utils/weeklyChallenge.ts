import type { Quest } from '@/store/models'
import { generateDailySeed, seededShuffle } from '@/utils/dailyQuests'

/** ISO week key: Monday-start week in local timezone (e.g. 2026-W20). */
export function getIsoWeekKey(date = new Date()): string {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)

  const thursday = new Date(d)
  thursday.setDate(thursday.getDate() + 3)
  const isoYear = thursday.getFullYear()

  const yearStart = new Date(isoYear, 0, 1)
  yearStart.setHours(12, 0, 0, 0)
  const firstThursday = new Date(yearStart)
  const startDay = firstThursday.getDay()
  firstThursday.setDate(firstThursday.getDate() + ((4 - startDay + 7) % 7))

  const weekNum =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))

  return `${isoYear}-W${String(weekNum).padStart(2, '0')}`
}

export function pickWeeklyChallengeQuestId(
  allQuests: Quest[],
  weekKey: string,
  completedQuests: number[],
): number | null {
  if (allQuests.length === 0) return null
  const seed = ((generateDailySeed(weekKey) * 41) ^ 0x9e37) >>> 0 || 1
  const completedNonRepeatable = new Set(
    allQuests.filter((q) => !q.is_repeatable && completedQuests.includes(q.id)).map((q) => q.id),
  )
  const pool = allQuests.filter(
    (q) =>
      (q.difficulty === 'intermediate' || q.difficulty === 'advanced') &&
      !completedNonRepeatable.has(q.id),
  )
  const source = pool.length > 0 ? pool : allQuests
  const shuffled = seededShuffle(source, seed)
  return shuffled[0]?.id ?? null
}

export function syncWeeklyChallengeState(
  quests: Quest[],
  storedWeek: string,
  storedQuestId: number,
  _completedWeek: string,
  completedQuests: number[],
): {
  weekKey: string
  questId: number
  needsPersist: boolean
} {
  const weekKey = getIsoWeekKey()
  let questId = storedQuestId
  let needsPersist = false

  if (storedWeek !== weekKey || !questId || !quests.some((q) => q.id === questId)) {
    const picked = pickWeeklyChallengeQuestId(quests, weekKey, completedQuests)
    questId = picked ?? 0
    needsPersist = storedWeek !== weekKey || storedQuestId !== questId
  }

  return { weekKey, questId, needsPersist }
}

export function isWeeklyChallengeComplete(
  weekKey: string,
  completedWeek: string,
  questId: number,
  _completedQuests: number[],
): boolean {
  if (!questId) return false
  return completedWeek === weekKey
}
