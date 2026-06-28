import type { Quest, QuestCompletionLog } from '@/store/models'
import { getQuestsDueForReview } from '@/utils/questSpacedReview'
import type { QuestReviewEntry } from '@/utils/questSpacedReview'

export type ReviewShelfItem = {
  questId: number
  questTitle: string
  daysOverdue: number
  reason: 'scheduled' | 'legacy'
}

function daysSince(dateStr: string, today: string): number {
  const a = new Date(dateStr.slice(0, 10))
  const b = new Date(today.slice(0, 10))
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86_400_000))
}

export function buildReviewShelfItems(
  quests: Quest[],
  logs: QuestCompletionLog[],
  schedule: Record<string, QuestReviewEntry>,
  today: string,
  getTitle: (quest: Quest) => string,
  maxItems = 4,
): ReviewShelfItem[] {
  if (logs.length === 0) return []
  const due = getQuestsDueForReview(schedule, logs, quests, today)
  const items: ReviewShelfItem[] = []

  for (const quest of due) {
    const entry = schedule[String(quest.id)]
    let daysOverdue = 0
    if (entry) {
      daysOverdue = daysSince(entry.nextReviewAt, today)
    } else {
      const lastLog = logs.filter((l) => l.questId === quest.id).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
      if (lastLog && quest.review_after_days) {
        const elapsed = daysSince(lastLog.completedAt, today)
        daysOverdue = Math.max(0, elapsed - quest.review_after_days)
      }
    }
    items.push({
      questId: quest.id,
      questTitle: getTitle(quest),
      daysOverdue: Math.max(1, daysOverdue || 1),
      reason: entry ? 'scheduled' : 'legacy',
    })
  }

  return items
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, maxItems)
}
