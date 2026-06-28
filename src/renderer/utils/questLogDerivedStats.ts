import type { Quest, QuestCompletionLog, QuestTitleOverrides } from '@/store/models'
import type { Language } from '@/i18n/languages'
import { resolveQuestTitle } from '@/utils/questDisplay'

export function toLocalDateStrFromIso(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type QuestLogDerivedStats = {
  completionDates: string[]
  uniquePracticeDays: string[]
  dailyCounts: Map<string, number>
  maxDailyCount: number
}

/** Single pass over completion logs for timeline / heatmap / streak inputs. */
export function buildQuestLogDerivedStats(logs: QuestCompletionLog[]): QuestLogDerivedStats {
  const completionDates: string[] = []
  const uniquePracticeDays = new Set<string>()
  const dailyCounts = new Map<string, number>()
  let maxDailyCount = 0

  for (const log of logs) {
    completionDates.push(log.completedAt)
    const day = toLocalDateStrFromIso(log.completedAt)
    uniquePracticeDays.add(day)
    const count = (dailyCounts.get(day) ?? 0) + 1
    dailyCounts.set(day, count)
    if (count > maxDailyCount) maxDailyCount = count
  }

  return {
    completionDates,
    uniquePracticeDays: [...uniquePracticeDays].sort(),
    dailyCounts,
    maxDailyCount,
  }
}

export type TimelineMonthGroup = {
  year: number
  month: number
  entries: TimelineEntryDerived[]
}

export type TimelineEntryDerived = {
  questId: number
  title: string
  completedAt: string
  dateStr: string
  xpEarned: number
  weekOfMonth: number
  thumbnailUrl?: string
}

export function buildTimelineMonthGroups(params: {
  logs: QuestCompletionLog[]
  questMap: Map<number, Quest>
  workThumbByQuestId: Map<number, string>
  lang: Language
  questTitleOverrides?: QuestTitleOverrides
  getWeekOfMonth: (iso: string) => number
}): TimelineMonthGroup[] {
  const { logs, questMap, workThumbByQuestId, lang, questTitleOverrides, getWeekOfMonth } = params
  const entries: TimelineEntryDerived[] = []

  for (const log of logs) {
    const q = questMap.get(log.questId)
    if (!q) continue
    entries.push({
      questId: log.questId,
      title: resolveQuestTitle(q, lang, questTitleOverrides),
      completedAt: log.completedAt,
      dateStr: toLocalDateStrFromIso(log.completedAt),
      xpEarned: log.xpEarned,
      weekOfMonth: getWeekOfMonth(log.completedAt),
      thumbnailUrl: workThumbByQuestId.get(log.questId),
    })
  }

  entries.sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const months = new Map<string, TimelineEntryDerived[]>()
  for (const e of entries) {
    const key = e.dateStr.slice(0, 7)
    if (!months.has(key)) months.set(key, [])
    months.get(key)!.push(e)
  }

  const grouped: TimelineMonthGroup[] = []
  for (const key of [...months.keys()].sort()) {
    const [y, m] = key.split('-').map(Number)
    grouped.push({ year: y, month: m - 1, entries: months.get(key)! })
  }
  return grouped
}

export function countUniqueQuestsPerCategory(
  logs: QuestCompletionLog[],
  questsLookup: Map<number, Quest>,
): Record<string, number> {
  const byCategory = new Map<string, Set<number>>()
  for (const log of logs) {
    const q = questsLookup.get(log.questId)
    if (!q?.category) continue
    if (!byCategory.has(q.category)) byCategory.set(q.category, new Set())
    byCategory.get(q.category)!.add(log.questId)
  }
  const out: Record<string, number> = {}
  for (const [cat, ids] of byCategory) out[cat] = ids.size
  return out
}
