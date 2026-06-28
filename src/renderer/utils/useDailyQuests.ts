import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import type { Quest } from '@/store/models'
import { sortDailyQuestsByFavoriteOrder } from '@/utils/dailyQuestGenerator'
import { checkAndGenerateDailyQuests } from '@/utils/dailyQuestCoordinator'

/**
 * Daily quests synced with the store. Re-runs generation after quests JSON
 * finishes loading or when favorite categories / profile prefs change.
 */
export function useDailyQuests(): Quest[] {
  const { quests, dailyQuestsIds, questsLoaded } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      dailyQuestsIds: s.dailyQuestsIds,
      questsLoaded: s.questsLoaded,
    })),
  )
  const { isLoaded, favoriteCategories, useRandomCategories, learningProfile } = useUIStore(
    useShallow((s) => ({
      isLoaded: s.isLoaded,
      favoriteCategories: s.settings.favoriteCategories,
      useRandomCategories: s.settings.useRandomCategories,
      learningProfile: s.settings.learningProfile,
    })),
  )

  useEffect(() => {
    if (!isLoaded || !questsLoaded) return
    checkAndGenerateDailyQuests()
  }, [isLoaded, questsLoaded, favoriteCategories, useRandomCategories, learningProfile])

  return useMemo(
    () =>
      sortDailyQuestsByFavoriteOrder(quests, dailyQuestsIds, {
        favoriteCategories,
        useRandomCategories,
        learningProfile,
      }),
    [quests, dailyQuestsIds, favoriteCategories, useRandomCategories, learningProfile],
  )
}
