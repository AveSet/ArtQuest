import type { Quest, QuestCompletionLog, Settings, StreakState, AdaptiveWeights, Skill } from '@/store/models'
import type { SkillNode } from '@/store/models'
import {
  generateDailySeed,
  resolveDailyQuestSlots,
  shouldOfferStreakRecovery,
} from '@/utils/dailyQuests'
import { generateDailyQuests as generateDailyQuestsFn } from '@/utils/dailyQuestGenerator'
import { getNodesDueForReview, getReviewableQuestIds } from '@/utils/skillReview'
import { getQuestsDueForReview, pickReviewQuestForDaily } from '@/utils/questSpacedReview'
import { computeFlowMetrics } from '@/utils/adaptiveDifficulty'
import { computeAvgSkillLevel } from '@/utils/recommendedQuest'

export type DailyQuestOrchestratorInput = {
  today: string
  quests: Quest[]
  completedQuests: number[]
  completedToday: number[]
  questCompletionLogs: QuestCompletionLog[]
  dailyQuestsIds: number[]
  lastDailyQuestDate: string
  lastFavCategories: string
  dailyBonusGrantedDate: string
  settings: Settings
  skillNodes: SkillNode[]
  legacySkills: Skill[]
  questReviewSchedule: Record<string, { nextReviewAt: string; intervalDays: number; easeFactor: number }>
  adaptiveWeights: AdaptiveWeights
  streakState: StreakState
  isSameDay: boolean
}

export type DailyQuestOrchestratorResult = {
  dailyQuestsIds: number[]
  lastDailyQuestDate: string
  completedToday: number[]
  lastFavCategories: string
  dailyBonusGrantedDate: string
  dailyQuests: Quest[]
  streakStatePatch?: StreakState
}

export function resolvePlayerAvgLevel(
  skillNodes: SkillNode[],
  legacySkills: Skill[],
  experienceTier: Settings['experienceTier'],
): number {
  if (skillNodes.length > 0) {
    return computeAvgSkillLevel(skillNodes, experienceTier ?? 'beginner')
  }
  return Math.max(
    1,
    Math.round(
      legacySkills.reduce((sum, s) => sum + s.level, 0) / Math.max(1, legacySkills.length),
    ) || 1,
  )
}

/** Pure daily quest generation — caller applies quest/UI store patches. */
export function orchestrateDailyQuestGeneration(
  input: DailyQuestOrchestratorInput,
  favKey: string,
): DailyQuestOrchestratorResult {
  const {
    today,
    quests,
    completedQuests,
    completedToday,
    questCompletionLogs,
    settings,
    skillNodes,
    legacySkills,
    questReviewSchedule,
    adaptiveWeights,
    streakState,
    isSameDay,
    dailyBonusGrantedDate,
  } = input

  const experienceTier = settings.experienceTier ?? 'beginner'
  const avgLevel = resolvePlayerAvgLevel(skillNodes, legacySkills, experienceTier)

  const reviewNodes = getNodesDueForReview(skillNodes, today)
  const skillReviewQuestIds = getReviewableQuestIds(reviewNodes, quests)
  const dueForReview = getQuestsDueForReview(questReviewSchedule, questCompletionLogs, quests, today)
  const pickedSpacedReview = pickReviewQuestForDaily(dueForReview, completedToday, generateDailySeed(today))
  const skillReviewPick = skillReviewQuestIds[0]
  const reviewQuestIds = [
    ...new Set([
      ...(pickedSpacedReview != null ? [pickedSpacedReview] : []),
      ...(skillReviewPick != null ? [skillReviewPick] : []),
    ]),
  ]

  const streakStatePatch =
    shouldOfferStreakRecovery(streakState.lastActiveDate, today, streakState.current) &&
    streakState.streakRecoveryDueDate !== today
      ? { ...streakState, streakRecoveryDueDate: today }
      : undefined
  const effectiveStreak = streakStatePatch ?? streakState

  const dailySlots = resolveDailyQuestSlots(effectiveStreak, today)
  const flowMetrics = computeFlowMetrics(questCompletionLogs, quests)
  const newDailyIds = generateDailyQuestsFn({
    allQuests: quests,
    count: dailySlots,
    avgLevel,
    completedQuests,
    favoriteCategories: settings.favoriteCategories,
    useRandomCategories: settings.useRandomCategories,
    learningProfile: settings.learningProfile,
    dateStr: today,
    reviewQuestIds,
    adaptiveWeights,
    flowMetrics,
    questCompletionLogs,
  })

  const preserveCompleted = isSameDay
    ? completedToday.filter((id) => newDailyIds.includes(id))
    : []

  return {
    dailyQuestsIds: newDailyIds,
    lastDailyQuestDate: today,
    completedToday: preserveCompleted,
    lastFavCategories: favKey,
    dailyBonusGrantedDate: isSameDay ? dailyBonusGrantedDate : '',
    dailyQuests: quests.filter((q) => newDailyIds.includes(q.id)),
    ...(streakStatePatch ? { streakStatePatch } : {}),
  }
}
