import type { QuestCompletionLog } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { getMistakeTagLabel } from '@/utils/mistakeTags'
import type { Language } from '@/i18n/translations'

export type MonthlyGrowthSummary = {
  monthKey: string
  totalQuests: number
  totalPracticeMinutes: number
  topGrowthCategory: QuestCategory | null
  topMistakeTag: string | null
  categoryCounts: Record<string, number>
}

function monthKeyFromDate(iso: string): string {
  return iso.slice(0, 7)
}

export function buildMonthlyGrowthSummary(
  logs: QuestCompletionLog[],
  today: string,
  language: Language,
): MonthlyGrowthSummary {
  const monthKey = monthKeyFromDate(today)
  const monthLogs = logs.filter((l) => l.completedAt.startsWith(monthKey))

  const categoryCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}
  let totalPracticeMinutes = 0

  for (const log of monthLogs) {
    const cat = log.category ?? 'drawing'
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    totalPracticeMinutes += log.practiceMinutes ?? 0
    for (const tag of log.feedback?.mistakeTags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  let topGrowthCategory: QuestCategory | null = null
  let topCount = 0
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > topCount) {
      topCount = count
      topGrowthCategory = cat as QuestCategory
    }
  }

  let topMistakeTag: string | null = null
  let topTagCount = 0
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > topTagCount) {
      topTagCount = count
      topMistakeTag = getMistakeTagLabel(tag, language)
    }
  }

  return {
    monthKey,
    totalQuests: monthLogs.length,
    totalPracticeMinutes,
    topGrowthCategory,
    topMistakeTag,
    categoryCounts,
  }
}
