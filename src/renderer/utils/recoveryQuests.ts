import type { Quest, QuestCompletionLog } from '@/store/models'
import { filterQuestsForPlayerLevel } from '@/utils/questLevelGate'

const DIFFICULTY_ORDER: Quest['difficulty'][] = [
  'novice', 'intermediate', 'advanced', 'master', 'expert',
]

/** Pick recovery quests: easier quests from user's weakest categories */
export function getRecoveryQuests(
  quests: Quest[],
  completedQuests: number[],
  avgLevel: number,
  logs: QuestCompletionLog[],
  count: number = 2,
): Quest[] {
  if (quests.length === 0) return []

  const categoryScores = new Map<string, { total: number; count: number }>()
  for (const log of logs) {
    const cat = log.category
    if (!cat) continue
    const entry = categoryScores.get(cat) ?? { total: 0, count: 0 }
    entry.total += DIFFICULTY_ORDER.indexOf(log.difficulty) + 1
    entry.count++
    categoryScores.set(cat, entry)
  }

  const weakestCategories = [...categoryScores.entries()]
    .map(([cat, score]) => ({ cat, avg: score.total / score.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map((e) => e.cat)

  const completedNonRepeatable = new Set(
    quests.filter((q) => !q.is_repeatable && completedQuests.includes(q.id)).map((q) => q.id),
  )

  const unlocked = quests.filter((q) => !completedNonRepeatable.has(q.id))
  const eligible = filterQuestsForPlayerLevel(unlocked, Math.max(1, avgLevel - 1))

  const picked: Quest[] = []
  const used = new Set<number>()

  for (const cat of weakestCategories) {
    if (picked.length >= count) break
    const pool = eligible
      .filter((q) => q.category === cat && !used.has(q.id))
      .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty))
    for (const q of pool) {
      if (picked.length >= count) break
      picked.push(q)
      used.add(q.id)
    }
  }

  if (picked.length < count) {
    const fallback = eligible
      .filter((q) => !used.has(q.id))
      .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty))
    for (const q of fallback) {
      if (picked.length >= count) break
      picked.push(q)
    }
  }

  return picked
}

/** Whether today qualifies for recovery quests (missed 1+ day, streak > 0) */
export function shouldOfferRecoveryQuests(
  lastActiveDate: string,
  today: string,
  currentStreak: number,
): boolean {
  if (!lastActiveDate || currentStreak <= 0) return false
  const diff = calendarDaysBetween(lastActiveDate, today)
  return diff >= 2 && diff <= 7
}

function calendarDaysBetween(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00')
  const b = new Date(to + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}
