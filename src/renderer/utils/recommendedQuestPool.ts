import type { Quest, QuestCompletionLog, SkillNode } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import type { ExperienceTier } from '@/utils/experienceTier'
import type { FundamentalsProgress } from '@/utils/fundamentalsProgress'
import { getQuestUnlockState } from '@/utils/questPrerequisites'
import { isQuestUnlockedForPlayerLevel } from '@/utils/questLevelGate'
import { computeAvgSkillLevel, pickRecommendedQuest } from '@/utils/recommendedQuest'

/** Max quests shown in catalog «Recommended» view (daily + pick + difficulty fill). */
export const RECOMMENDED_CATALOG_CAP = 24

const DIFFICULTY_ORDER: Record<string, number> = {
  novice: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5,
}

export function buildRecommendedQuestPool(params: {
  filteredQuests: Quest[]
  quests: Quest[]
  completedQuests: number[]
  satisfiedOnceIds: Set<number>
  dailyQuestsIds: number[]
  completedToday: number[]
  skillNodes: SkillNode[]
  experienceTier: ExperienceTier
  fundamentalsProgress: FundamentalsProgress
  visibleCategories: QuestCategory[]
  questCompletionLogs: QuestCompletionLog[]
  cap?: number
}): Quest[] {
  const {
    filteredQuests,
    quests,
    completedQuests,
    satisfiedOnceIds,
    dailyQuestsIds,
    completedToday,
    skillNodes,
    experienceTier,
    fundamentalsProgress,
    visibleCategories,
    questCompletionLogs,
    cap = RECOMMENDED_CATALOG_CAP,
  } = params

  const avgLevel = computeAvgSkillLevel(skillNodes, experienceTier)
  const dailyQuests = quests.filter((q) => dailyQuestsIds.includes(q.id))
  const rec = pickRecommendedQuest({
    quests,
    completedQuests,
    dailyQuests,
    completedToday,
    skillNodes,
    experienceTier,
    fundamentalsProgress,
    visibleCategories,
    questCompletionLogs,
  })
  const completedNonRepeatable = new Set(
    quests.filter((q) => !q.is_repeatable && completedQuests.includes(q.id)).map((q) => q.id),
  )
  const eligible = filteredQuests.filter(
    (q) =>
      isQuestUnlockedForPlayerLevel(q, avgLevel) &&
      !completedNonRepeatable.has(q.id) &&
      getQuestUnlockState(q, completedQuests, satisfiedOnceIds).unlocked,
  )
  const sorted = [...eligible].sort(
    (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 10) - (DIFFICULTY_ORDER[b.difficulty] ?? 10),
  )
  const ids = new Set<number>()
  if (rec) ids.add(rec.quest.id)
  for (const q of dailyQuests) ids.add(q.id)
  for (const q of sorted) {
    if (ids.size >= cap) break
    ids.add(q.id)
  }
  return sorted.filter((q) => ids.has(q.id)).slice(0, cap)
}
