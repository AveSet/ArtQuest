import { useQuestStore } from '@/store/useQuestStore'
import { useShallow } from 'zustand/react/shallow'

/** Batched quest selectors for Dashboard — fewer re-renders than many separate hooks. */
export function useDashboardQuestState() {
  return useQuestStore(
    useShallow((s) => ({
      questCompletionLogs: s.questCompletionLogs,
      completedQuests: s.completedQuests,
      completedToday: s.completedToday,
      quests: s.quests,
      questsLoaded: s.questsLoaded,
      questsLoadError: s.questsLoadError,
      questTitleOverrides: s.questTitleOverrides,
      lastCompletionReward: s.lastCompletionReward,
      dailyBonusGrantedDate: s.dailyBonusGrantedDate,
      lastWarmupCompletedDate: s.lastWarmupCompletedDate,
      fundamentalsProgress: s.fundamentalsProgress,
    })),
  )
}
