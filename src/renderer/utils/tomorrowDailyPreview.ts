import type { Quest, QuestCompletionLog } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { generateDailyQuests } from '@/utils/dailyQuestGenerator'
import type { LearningProfile } from '@/utils/learningProfile'
import { getLocalDateStr } from '@/utils/dailyQuests'

function addCalendarDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function peekTomorrowDailyCategories(params: {
  allQuests: Quest[]
  avgLevel: number
  completedQuests: number[]
  favoriteCategories?: QuestCategory[]
  useRandomCategories?: boolean
  learningProfile?: LearningProfile
  reviewQuestIds?: number[]
  questCompletionLogs?: QuestCompletionLog[]
}): QuestCategory[] {
  if (params.allQuests.length === 0) return []
  const tomorrow = addCalendarDays(getLocalDateStr(), 1)
  const ids = generateDailyQuests({
    ...params,
    count: 3,
    dateStr: tomorrow,
  })
  const categories = params.allQuests
    .filter((q) => ids.includes(q.id))
    .map((q) => q.category as QuestCategory)
  return [...new Set(categories)]
}
