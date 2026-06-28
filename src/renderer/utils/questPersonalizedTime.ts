import type { Quest, QuestCompletionLog } from '@/store/models'
import {
  filterQuestTimeLogs,
  median,
  roundQuestMinutes,
  type QuestTimeLogRow,
} from '@/utils/questTimeCalibration'

export type PersonalizedTimeConfidence = 'high' | 'medium' | 'low' | 'catalog'

export type PersonalizedQuestMinutes = {
  minutes: number
  catalogMinutes: number
  confidence: PersonalizedTimeConfidence
  /** True when estimate differs from catalog and confidence is not catalog-only. */
  isPersonalized: boolean
}

const QUEST_SPECIFIC_MIN = 3
const COHORT_MIN = 8

function asTimeLogs(logs: QuestCompletionLog[]): QuestTimeLogRow[] {
  return logs.map((log) => ({
    questId: log.questId,
    practiceMinutes: log.practiceMinutes,
    status: log.status,
    isSpeedRun: log.isSpeedRun,
  }))
}

function minutesFromLogs(logs: QuestTimeLogRow[]): number[] {
  return filterQuestTimeLogs(logs)
    .map((log) => log.practiceMinutes!)
    .filter((m) => m > 0)
}

export function getPersonalizedQuestMinutes(
  quest: Pick<Quest, 'id' | 'estimatedTime' | 'category' | 'difficulty'>,
  completionLogs: QuestCompletionLog[],
  catalogQuests: Pick<Quest, 'id' | 'estimatedTime' | 'category' | 'difficulty'>[] = [],
): PersonalizedQuestMinutes {
  const catalogMinutes = quest.estimatedTime
  const timeLogs = asTimeLogs(completionLogs)
  const questLogs = timeLogs.filter((log) => log.questId === quest.id)
  const questMinutes = minutesFromLogs(questLogs)

  if (questMinutes.length >= QUEST_SPECIFIC_MIN) {
    const med = median(questMinutes)
    if (med != null) {
      return {
        minutes: roundQuestMinutes(med),
        catalogMinutes,
        confidence: 'high',
        isPersonalized: roundQuestMinutes(med) !== catalogMinutes,
      }
    }
  }

  const cohortIds = new Set(
    catalogQuests
      .filter((q) => q.category === quest.category && q.difficulty === quest.difficulty)
      .map((q) => q.id),
  )
  const cohortMinutes = minutesFromLogs(timeLogs.filter((log) => cohortIds.has(log.questId)))
  if (cohortMinutes.length >= COHORT_MIN) {
    const med = median(cohortMinutes)
    if (med != null) {
      const minutes = roundQuestMinutes(med)
      return {
        minutes,
        catalogMinutes,
        confidence: 'medium',
        isPersonalized: minutes !== catalogMinutes,
      }
    }
  }

  const ratios: number[] = []
  const catalogById = new Map(catalogQuests.map((q) => [q.id, q]))
  for (const log of filterQuestTimeLogs(timeLogs)) {
    const catalog = catalogById.get(log.questId)
    if (!catalog || catalog.estimatedTime <= 0) continue
    ratios.push(log.practiceMinutes! / catalog.estimatedTime)
  }
  if (ratios.length >= COHORT_MIN) {
    const pace = median(ratios)
    if (pace != null && pace > 0) {
      const minutes = roundQuestMinutes(catalogMinutes * pace)
      return {
        minutes,
        catalogMinutes,
        confidence: 'low',
        isPersonalized: minutes !== catalogMinutes,
      }
    }
  }

  return {
    minutes: catalogMinutes,
    catalogMinutes,
    confidence: 'catalog',
    isPersonalized: false,
  }
}

/** Last successful completion time for a quest (most recent log, excluding timeouts). */
export function getLastQuestCompletionMinutes(
  questId: number,
  completionLogs: QuestCompletionLog[],
): number | null {
  for (let i = completionLogs.length - 1; i >= 0; i--) {
    const log = completionLogs[i]!
    if (log.questId !== questId) continue
    if (log.status === 'timeout') continue
    if (typeof log.practiceMinutes === 'number' && log.practiceMinutes > 0) {
      return roundQuestMinutes(log.practiceMinutes)
    }
  }
  return null
}
