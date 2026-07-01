import type { Quest, QuestCompletionLog, SkillNode, CompletedWork } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import type { QuestReviewEntry } from '@/utils/questSpacedReview'
import { getQuestsDueForReview } from '@/utils/questSpacedReview'
import { getNodesDueForReview } from '@/utils/skillReview'
import { getWeakestCriterionThisWeek } from '@/utils/feedbackAnalytics'
import { pickRecommendedQuest, type RecommendedQuestReason } from '@/utils/recommendedQuest'
import { getPersonalizedQuestMinutes } from '@/utils/questPersonalizedTime'
import type { ExperienceTier } from '@/utils/experienceTier'
import {
  getNextFundamentalsExercise,
  getFundamentalsCompletedCount,
  isFundamentalsGateCleared,
  shouldGateDailiesForBeginner,
  shouldPrioritizeFundamentalsAction,
  type FundamentalsProgress,
} from '@/utils/fundamentalsProgress'
import { FUNDAMENTALS_EXERCISE_COUNT } from '@/data/fundamentalsExercises'
import { getWarmupQuestForDate, isWarmupCompletedToday } from '@/utils/warmupQuest'
import { getMistakeTagLabel } from '@/utils/mistakeTags'
import {
  buildMaterialsLearnPath,
  collectLearningFocusTags,
  pickBestDailyQuest,
} from '@/utils/learningFocus'
import type { EnergyMode } from '@/utils/soloChapters'
import { countDailyQuestsCompleted } from '@/utils/dailyQuests'
import type { Language } from '@/i18n/translations'
import { fmt, getDashboardCopy } from '@/i18n/dashboardCopy'

export type NextActionKind =
  | 'warmup'
  | 'fundamentals'
  | 'daily_quest'
  | 'quest_review'
  | 'skill_review'
  | 'recommended_quest'
  | 'materials'

export type LearningPlanStep = {
  step: 1 | 2 | 3
  kind: NextActionKind
  title: string
  reason: string
  questId?: number
  skillNodeId?: string
  href?: string
}

export type NextBestAction = {
  primary: {
    kind: NextActionKind
    quest?: Quest
    skillNodeId?: string
    href?: string
    reasonKey:
      | RecommendedQuestReason
      | 'warmup'
      | 'fundamentals'
      | 'daily'
      | 'review'
      | 'weak_criterion'
      | 'skill_review'
    reasonParams?: Record<string, string>
  }
  /** Optional focus pick shown while dailies remain (mistake-driven practice). */
  secondary?: {
    kind: NextActionKind
    quest: Quest
    reasonKey: RecommendedQuestReason
    reasonParams?: Record<string, string>
  }
  plan: LearningPlanStep[]
}

export type BuildNextBestActionParams = {
  today: string
  language: Language
  quests: Quest[]
  completedQuests: number[]
  dailyQuests: Quest[]
  completedToday: number[]
  skillNodes: SkillNode[]
  questCompletionLogs: QuestCompletionLog[]
  questReviewSchedule: Record<string, QuestReviewEntry>
  lastWarmupCompletedDate: string
  experienceTier?: ExperienceTier
  fundamentalsProgress?: FundamentalsProgress
  visibleCategories?: QuestCategory[]
  warmupAvailable?: boolean
  completedWorks?: CompletedWork[]
  focusTags?: string[]
  favoriteCategories?: QuestCategory[]
  materialEngagement?: Record<string, 'viewed' | 'helpful' | 'applied'>
  weakCriterion?: string
  adaptiveWeights?: Record<string, number>
  energyMode?: EnergyMode
}

function localizeCriterion(criterion: string, language: Language): string {
  if (language !== 'ru') return criterion
  const map: Record<string, string> = {
    line_confidence: 'уверенность линии',
    proportion: 'пропорции',
    value_range: 'тон и светотень',
    composition: 'композиция',
    timing: 'тайминг',
    pose: 'жест и поза',
  }
  return map[criterion] ?? getMistakeTagLabel(criterion, language)
}

/** Builds today's prioritized action and a 3-step learning plan for the dashboard. */
export function buildNextBestAction(params: BuildNextBestActionParams): NextBestAction | null {
  const {
    today,
    language,
    quests,
    completedQuests,
    dailyQuests,
    completedToday,
    skillNodes,
    questCompletionLogs,
    questReviewSchedule,
    lastWarmupCompletedDate,
    experienceTier = 'beginner',
    fundamentalsProgress = { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' },
    visibleCategories,
    completedWorks = [],
    focusTags: focusTagsIn,
    favoriteCategories = [],
    weakCriterion: weakCriterionIn,
    adaptiveWeights,
    energyMode,
  } = params

  const gateCleared = isFundamentalsGateCleared(fundamentalsProgress)
  const baseWarmupAvailable =
    params.warmupAvailable ?? !isWarmupCompletedToday(lastWarmupCompletedDate, today)
  const warmupAvailable =
    baseWarmupAvailable && !(experienceTier === 'beginner' && gateCleared)
  const warmupQuest = getWarmupQuestForDate(today)
  const prioritizeFundamentals = shouldPrioritizeFundamentalsAction(experienceTier, fundamentalsProgress)
  const nextFundamentals = prioritizeFundamentals
    ? getNextFundamentalsExercise(fundamentalsProgress)
    : undefined
  const gateDailies = shouldGateDailiesForBeginner(experienceTier, fundamentalsProgress)

  const incompleteDaily = gateDailies
    ? []
    : dailyQuests.filter((q) => !completedToday.includes(q.id))
  const reviewQuests = getQuestsDueForReview(questReviewSchedule, questCompletionLogs, quests, today)
  const reviewNodes = getNodesDueForReview(skillNodes, today)
  const weakest = weakCriterionIn
    ? { criterion: weakCriterionIn, avgScore: 0 }
    : getWeakestCriterionThisWeek(questCompletionLogs)

  const focusTags =
    focusTagsIn ??
    collectLearningFocusTags({
      questCompletionLogs,
      completedWorks,
      weakCriterion: weakest?.criterion,
    })

  const materialsPath = buildMaterialsLearnPath(focusTags)

  const resolveMinutes = (q: Quest) =>
    getPersonalizedQuestMinutes(q, questCompletionLogs, quests).minutes

  const recommended = gateDailies
    ? null
    : pickRecommendedQuest({
        quests,
        completedQuests,
        dailyQuests,
        completedToday,
        skillNodes,
        experienceTier,
        visibleCategories,
        questCompletionLogs,
        completedWorks,
        focusTags,
        weakCriterion: weakest?.criterion,
        adaptiveWeights,
        energyMode,
        resolveMinutes,
      })

  const focusRecommendation =
    !gateDailies &&
    focusTags.length > 0 &&
    incompleteDaily.length > 0
      ? pickRecommendedQuest({
          quests,
          completedQuests,
          dailyQuests,
          completedToday,
          skillNodes,
          visibleCategories,
          questCompletionLogs,
          completedWorks,
          focusTags,
          weakCriterion: weakest?.criterion,
          adaptiveWeights,
          energyMode,
          skipDailyGate: true,
          resolveMinutes,
        })
      : null

  const bestDaily = pickBestDailyQuest(incompleteDaily, focusTags, favoriteCategories)
  const dailyDoneCount = countDailyQuestsCompleted(
    dailyQuests.map((q) => q.id),
    completedToday,
  )

  const d = getDashboardCopy(language)
  const plan: LearningPlanStep[] = []

  if (nextFundamentals) {
    plan.push({
      step: 1,
      kind: 'fundamentals',
      title: d.learningPlanFundamentalsTitle ?? 'Fundamentals exercise',
      reason: gateCleared
        ? (d.learningPlanFundamentalsReasonShort ?? '')
        : (d.learningPlanFundamentalsReason ?? ''),
      questId: nextFundamentals.id,
    })
  } else if (warmupAvailable) {
    plan.push({
      step: 1,
      kind: 'warmup',
      title: d.learningPlanWarmupTitle ?? '5-minute warm-up',
      reason: d.learningPlanWarmupReason ?? '',
      questId: warmupQuest.id,
    })
  }

  if (incompleteDaily.length > 0 && bestDaily) {
    plan.push({
      step: plan.length > 0 ? 2 : 1,
      kind: 'daily_quest',
      title: d.learningPlanDailyTitle ?? 'Daily quest',
      reason: fmt(d.learningPlanDailyReason ?? '', {
        done: dailyDoneCount,
        total: dailyQuests.length,
      }),
      questId: bestDaily.id,
    })
  } else if (reviewQuests.length > 0) {
    const rq = reviewQuests[0]!
    plan.push({
      step: 1,
      kind: 'quest_review',
      title: d.learningPlanQuestReviewTitle ?? 'Quest review',
      reason: d.learningPlanQuestReviewReason ?? '',
      questId: rq.id,
    })
  } else if (recommended?.quest) {
    let reason = d.learningPlanRecommendedWeakest ?? ''
    if (recommended.reason === 'weak_criterion' && weakest) {
      reason = fmt(d.learningPlanRecommendedWeakCriterion ?? '', {
        criterion: localizeCriterion(weakest.criterion, language),
      })
    } else if (recommended.reason === 'improvement_focus') {
      reason = d.learningPlanRecommendedImprovement ?? reason
    } else if (recommended.reason === 'mistake_tags') {
      reason = d.learningPlanRecommendedMistake ?? reason
    }
    plan.push({
      step: 1,
      kind: 'recommended_quest',
      title: d.learningPlanRecommendedTitle ?? 'Recommended practice',
      reason,
      questId: recommended.quest.id,
    })
  }

  if (reviewNodes.length > 0) {
    const node = reviewNodes[0]!
    const skillNode = skillNodes.find((n) => n.id === node.nodeId)
    plan.push({
      step: (plan.length + 1) as 1 | 2 | 3,
      kind: 'skill_review',
      title: skillNode?.title[language] ?? node.nodeId,
      reason: fmt(d.learningPlanSkillReviewReason ?? '', { days: node.daysOverdue }),
      skillNodeId: node.nodeId,
      href: `/skills?node=${encodeURIComponent(node.nodeId)}`,
    })
  }

  if (weakest && plan.length < 3) {
    plan.push({
      step: (plan.length + 1) as 1 | 2 | 3,
      kind: 'materials',
      title: d.learningPlanMaterialsTitle ?? 'Materials for weak spot',
      reason: fmt(d.learningPlanMaterialsReason ?? '', {
        criterion: localizeCriterion(weakest.criterion, language),
      }),
      href: materialsPath,
    })
  }

  const normalizedPlan = plan.slice(0, 3).map((s, i) => ({ ...s, step: (i + 1) as 1 | 2 | 3 }))

  const secondary =
    focusRecommendation &&
    bestDaily &&
    focusRecommendation.quest.id !== bestDaily.id &&
    (focusRecommendation.reason === 'mistake_tags' ||
      focusRecommendation.reason === 'weak_criterion' ||
      focusRecommendation.reason === 'improvement_focus')
      ? {
          kind: 'recommended_quest' as const,
          quest: focusRecommendation.quest,
          reasonKey: focusRecommendation.reason,
          reasonParams: weakest
            ? { criterion: localizeCriterion(weakest.criterion, language) }
            : undefined,
        }
      : undefined

  if (nextFundamentals) {
    return {
      primary: {
        kind: 'fundamentals',
        quest: nextFundamentals,
        reasonKey: 'fundamentals',
        reasonParams: {
          done: String(getFundamentalsCompletedCount(fundamentalsProgress)),
          total: String(FUNDAMENTALS_EXERCISE_COUNT),
        },
      },
      secondary: gateDailies ? undefined : secondary,
      plan: normalizedPlan.length > 0 ? normalizedPlan : [
        {
          step: 1,
          kind: 'fundamentals',
          title: d.learningPlanFundamentalsTitle ?? 'Fundamentals exercise',
          reason: d.learningPlanFundamentalsReasonShort ?? '',
          questId: nextFundamentals.id,
        },
      ],
    }
  }

  if (warmupAvailable) {
    return {
      primary: {
        kind: 'warmup',
        quest: warmupQuest,
        reasonKey: 'warmup',
        reasonParams: {},
      },
      secondary,
      plan: normalizedPlan.length > 0 ? normalizedPlan : [
        {
          step: 1,
          kind: 'warmup',
          title: d.learningPlanWarmupTitle ?? '5-minute warm-up',
          reason: d.learningPlanWarmupReasonShort ?? '',
          questId: warmupQuest.id,
        },
      ],
    }
  }

  if (incompleteDaily.length > 0 && bestDaily) {
    const quest = bestDaily
    return {
      primary: {
        kind: 'daily_quest',
        quest,
        reasonKey: 'daily',
        reasonParams: {
          done: String(dailyDoneCount),
          total: String(dailyQuests.length),
        },
      },
      secondary,
      plan: normalizedPlan,
    }
  }

  if (reviewQuests.length > 0) {
    const quest = reviewQuests[0]!
    return {
      primary: {
        kind: 'quest_review',
        quest,
        reasonKey: 'review',
      },
      plan: normalizedPlan,
    }
  }

  if (recommended?.quest) {
    return {
      primary: {
        kind: 'recommended_quest',
        quest: recommended.quest,
        reasonKey: recommended.reason,
        reasonParams: weakest
          ? { criterion: localizeCriterion(weakest.criterion, language) }
          : undefined,
      },
      plan: normalizedPlan,
    }
  }

  if (reviewNodes.length > 0) {
    const node = reviewNodes[0]!
    return {
      primary: {
        kind: 'skill_review',
        skillNodeId: node.nodeId,
        href: `/skills?node=${encodeURIComponent(node.nodeId)}`,
        reasonKey: 'skill_review',
        reasonParams: { days: String(node.daysOverdue) },
      },
      plan: normalizedPlan,
    }
  }

  if (weakest) {
    return {
      primary: {
        kind: 'materials',
        href: materialsPath,
        reasonKey: 'weak_criterion',
        reasonParams: { criterion: localizeCriterion(weakest.criterion, language) },
      },
      plan: normalizedPlan,
    }
  }

  const firstPlanStep = normalizedPlan[0]
  if (!firstPlanStep) return null

  return {
    primary: {
      kind: firstPlanStep.kind,
      quest: firstPlanStep.questId
        ? quests.find((q) => q.id === firstPlanStep.questId)
        : undefined,
      skillNodeId: firstPlanStep.skillNodeId,
      href: firstPlanStep.href,
      reasonKey: 'daily',
    },
    plan: normalizedPlan,
  }
}
