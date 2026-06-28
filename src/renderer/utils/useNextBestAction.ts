import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { useDailyQuests } from '@/utils/useDailyQuests'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { buildNextBestAction, type NextBestAction } from '@/utils/nextBestAction'
import { isWarmupCompletedToday } from '@/utils/warmupQuest'
import { isFundamentalsGateCleared } from '@/utils/fundamentalsProgress'
import { getWeakestCriterionThisWeek } from '@/utils/feedbackAnalytics'
import { collectLearningFocusTags } from '@/utils/learningFocus'

export type UseNextBestActionResult = {
  action: NextBestAction | null
  focusTags: string[]
  weakestCriterion: ReturnType<typeof getWeakestCriterionThisWeek>
  warmupAvailable: boolean
}

/** Single memoized next-step + focus tags for Dashboard, Statistics, etc. */
export function useNextBestAction(): UseNextBestActionResult {
  const { language } = useI18n()
  const {
    quests,
    completedQuests,
    completedToday,
    questCompletionLogs,
    completedWorks,
    lastWarmupCompletedDate,
    fundamentalsProgress,
  } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      completedQuests: s.completedQuests,
      completedToday: s.completedToday,
      questCompletionLogs: s.questCompletionLogs,
      completedWorks: s.completedWorks,
      lastWarmupCompletedDate: s.lastWarmupCompletedDate,
      fundamentalsProgress: s.fundamentalsProgress,
    })),
  )
  const {
    experienceTier,
    questReviewSchedule,
    materialEngagement,
    favoriteCategories,
    adaptiveWeights,
    energyMode,
  } = useUIStore(
    useShallow((s) => ({
      experienceTier: s.settings.experienceTier ?? 'beginner',
      questReviewSchedule: s.questReviewSchedule,
      materialEngagement: s.settings.materialEngagement ?? {},
      favoriteCategories: s.settings.favoriteCategories,
      adaptiveWeights: s.adaptiveWeights,
      energyMode: s.settings.energyMode ?? 'medium',
    })),
  )
  const skillNodes = useSkillStore(useShallow((s) => s.skillNodes))
  const dailyQuests = useDailyQuests()
  const visibleCategories = useVisibleCategories()
  const today = getLocalDateStr()

  const gateCleared = isFundamentalsGateCleared(fundamentalsProgress)
  const warmupAvailable =
    !isWarmupCompletedToday(lastWarmupCompletedDate, today) &&
    !(experienceTier === 'beginner' && gateCleared)

  const weakestCriterion = useMemo(
    () => getWeakestCriterionThisWeek(questCompletionLogs),
    [questCompletionLogs],
  )

  const focusTags = useMemo(
    () =>
      collectLearningFocusTags({
        questCompletionLogs,
        completedWorks,
        weakCriterion: weakestCriterion?.criterion,
      }),
    [questCompletionLogs, completedWorks, weakestCriterion],
  )

  const action = useMemo(
    () =>
      buildNextBestAction({
        today,
        language,
        quests,
        completedQuests,
        dailyQuests,
        completedToday,
        skillNodes,
        questCompletionLogs,
        completedWorks,
        questReviewSchedule,
        lastWarmupCompletedDate,
        experienceTier,
        fundamentalsProgress,
        visibleCategories,
        warmupAvailable,
        focusTags,
        favoriteCategories,
        materialEngagement,
        weakCriterion: weakestCriterion?.criterion,
        adaptiveWeights,
        energyMode,
      }),
    [
      today,
      language,
      quests,
      completedQuests,
      dailyQuests,
      completedToday,
      skillNodes,
      questCompletionLogs,
      completedWorks,
      questReviewSchedule,
      lastWarmupCompletedDate,
      experienceTier,
      fundamentalsProgress,
      visibleCategories,
      warmupAvailable,
      focusTags,
      favoriteCategories,
      materialEngagement,
      weakestCriterion,
      adaptiveWeights,
      energyMode,
    ],
  )

  return { action, focusTags, weakestCriterion, warmupAvailable }
}
