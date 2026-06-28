import type { Quest, SkillNode, QuestCompletionLog, CompletedWork } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { isQuestUnlockedForPlayerLevel } from '@/utils/questLevelGate'
import { dailyCategoryRoll, pickWeightedRecommendationCategory } from '@/utils/categorySkillBalance'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { getQuestUnlockState, getSatisfiedQuestIds } from '@/utils/questPrerequisites'
import {
  collectLearningFocusTags,
  questMatchesFocusTags,
} from '@/utils/learningFocus'
import { questDifficultyRank } from '../../shared/difficultyOrder'
import { ENERGY_MODE_MAX_MINUTES, type EnergyMode } from '@/utils/soloChapters'
import { effectiveNodeLevel } from '@/utils/skillUnlocks'
import type { ExperienceTier } from '@/utils/experienceTier'
import { minAvgLevelForTier } from '@/utils/experienceTier'
import {
  shouldGateDailiesForBeginner,
  EMPTY_FUNDAMENTALS_PROGRESS,
  type FundamentalsProgress,
} from '@/utils/fundamentalsProgress'
import { resolveAdaptiveWeight } from '@/utils/mistakeTags'
import { fmt } from '@/i18n/dashboardCopy'
import type { Translations } from '@/i18n/translations'

export type RecommendedQuestReason = 'weakest_track' | 'weak_criterion' | 'mistake_tags' | 'improvement_focus'

export function getRecommendedQuestReasonText(
  reason: RecommendedQuestReason,
  dashboard: Translations['dashboard'],
  opts?: { criterion?: string },
): string {
  switch (reason) {
    case 'mistake_tags':
      return dashboard.nextActionMistakeReason ?? ''
    case 'improvement_focus':
      return dashboard.nextActionImprovementReason ?? ''
    case 'weak_criterion':
      return fmt(dashboard.weakestCriterionBody ?? '', { criterion: opts?.criterion ?? '' })
    case 'weakest_track':
    default:
      return dashboard.recommendedWeakHint ?? ''
  }
}

export function computeAvgSkillLevel(
  skillNodes: SkillNode[],
  experienceTier: ExperienceTier = 'beginner',
): number {
  const tierFloor = minAvgLevelForTier(experienceTier)
  if (skillNodes.length === 0) return tierFloor
  const sum = skillNodes.reduce((acc, n) => acc + effectiveNodeLevel(n), 0)
  const fromNodes = Math.max(1, Math.round(sum / skillNodes.length))
  return Math.max(fromNodes, tierFloor)
}

export function pickRecommendedQuest(params: {
  quests: Quest[]
  completedQuests: number[]
  dailyQuests: Quest[]
  completedToday: number[]
  skillNodes: SkillNode[]
  experienceTier?: ExperienceTier
  fundamentalsProgress?: FundamentalsProgress
  visibleCategories?: QuestCategory[]
  questCompletionLogs?: QuestCompletionLog[]
  completedWorks?: CompletedWork[]
  weakCriterion?: string
  /** Precomputed focus tags (logs + gallery + criterion). */
  focusTags?: string[]
  /** Override today for weighted category roll (tests). */
  dateStr?: string
  /** Mistake-tag weights from adaptive difficulty (boosts matching quests). */
  adaptiveWeights?: Record<string, number>
  /** Cap quest duration by energy mode preference. */
  energyMode?: EnergyMode
  /** Optional per-quest minute estimate (e.g. personalized pace). */
  resolveMinutes?: (quest: Quest) => number
  /** When true, returns a focus pick even if daily quests remain incomplete. */
  skipDailyGate?: boolean
}): { quest: Quest; reason: RecommendedQuestReason } | null {
  const {
    quests,
    completedQuests,
    dailyQuests,
    completedToday,
    skillNodes,
    visibleCategories,
    questCompletionLogs = [],
    completedWorks = [],
    weakCriterion,
    focusTags: focusTagsIn,
    dateStr,
    adaptiveWeights,
    energyMode,
    skipDailyGate = false,
    resolveMinutes,
  } = params

  const maxMinutes = energyMode ? ENERGY_MODE_MAX_MINUTES[energyMode] : undefined
  const questMinutes = (q: Quest) => resolveMinutes?.(q) ?? q.estimatedTime

  if (
    params.experienceTier === 'beginner' &&
    shouldGateDailiesForBeginner(
      'beginner',
      params.fundamentalsProgress ?? EMPTY_FUNDAMENTALS_PROGRESS,
    )
  ) {
    return null
  }

  const incompleteDaily = dailyQuests.filter((q) => !completedToday.includes(q.id))
  if (!skipDailyGate && incompleteDaily.length > 0) return null

  const avgLevel = computeAvgSkillLevel(skillNodes, params.experienceTier)
  const satisfied = getSatisfiedQuestIds(questCompletionLogs)
  const completedNonRepeatable = new Set(
    quests.filter((q) => !q.is_repeatable && (completedQuests.includes(q.id) || satisfied.has(q.id))).map((q) => q.id),
  )
  const eligible = quests.filter((q) => {
    if (!isQuestUnlockedForPlayerLevel(q, avgLevel)) return false
    if (completedNonRepeatable.has(q.id)) return false
    if (visibleCategories && !visibleCategories.includes(q.category)) return false
    if (maxMinutes != null && questMinutes(q) > maxMinutes) return false
    return getQuestUnlockState(q, completedQuests, satisfied).unlocked
  })
  if (eligible.length === 0) return null

  const focusTags =
    focusTagsIn ??
    collectLearningFocusTags({
      questCompletionLogs,
      completedWorks,
      weakCriterion,
    })

  const hasGalleryFocus =
    (completedWorks ?? []).some(
      (w) => (w.improvementNotes?.trim().length ?? 0) > 0 || (w.tags?.length ?? 0) > 0,
    )

  const hasMistakeTags = questCompletionLogs.some((l) => (l.feedback?.mistakeTags?.length ?? 0) > 0)

  const preferredCategory = pickWeightedRecommendationCategory(
    skillNodes,
    visibleCategories,
    dateStr ?? getLocalDateStr(),
  )

  const diffRank = (d: Quest['difficulty']) => questDifficultyRank(d)
  const pickDate = dateStr ?? getLocalDateStr()
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentlyDone = new Set(
    questCompletionLogs
      .filter((l) => new Date(l.completedAt).getTime() >= recentCutoff)
      .map((l) => l.questId),
  )

  const pickRotated = (pool: Quest[]): Quest | undefined => {
    const sorted = sortPool(pool)
    if (sorted.length === 0) return undefined
    const idx = dailyCategoryRoll(`${pickDate}:pick`) % sorted.length
    return sorted[idx] ?? sorted[0]
  }

  const adaptiveBoost = (q: Quest): number => {
    if (!adaptiveWeights) return 0
    const matches = q.tags.map((tag) => resolveAdaptiveWeight(adaptiveWeights, tag))
    if (matches.length === 0) return 0
    return matches.reduce((a, b) => a + b, 0) / matches.length
  }

  const sortPool = (pool: Quest[]) =>
    [...pool].sort((a, b) => {
      const adaptA = adaptiveBoost(a)
      const adaptB = adaptiveBoost(b)
      if (adaptB !== adaptA) return adaptB > adaptA ? 1 : -1
      const tagA = questMatchesFocusTags(a, focusTags)
      const tagB = questMatchesFocusTags(b, focusTags)
      if (tagB !== tagA) return tagB - tagA
      const da = diffRank(a.difficulty)
      const db = diffRank(b.difficulty)
      if (da !== db) return da - db
      const ma = questMinutes(a)
      const mb = questMinutes(b)
      if (ma !== mb) return ma - mb
      const ra = recentlyDone.has(a.id) ? 1 : 0
      const rb = recentlyDone.has(b.id) ? 1 : 0
      if (ra !== rb) return ra - rb
      return a.id - b.id
    })

  if (focusTags.length > 0) {
    const tagged = sortPool(eligible.filter((q) => questMatchesFocusTags(q, focusTags) > 0))
    if (tagged[0]) {
      let reason: RecommendedQuestReason = 'weakest_track'
      if (hasGalleryFocus && questMatchesFocusTags(tagged[0], focusTags) > 0) {
        reason = 'improvement_focus'
      } else if (hasMistakeTags) {
        reason = 'mistake_tags'
      } else if (weakCriterion) {
        reason = 'weak_criterion'
      }
      return { quest: tagged[0], reason }
    }
  }

  const preferred = eligible.filter((q) => q.category === preferredCategory)
  const pool = preferred.length > 0 ? preferred : eligible
  const quest = pickRotated(pool)
  return quest ? { quest, reason: 'weakest_track' } : null
}
