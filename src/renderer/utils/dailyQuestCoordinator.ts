import type { Quest } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'
import { getLocalDateStr, reconcileCompletedToday } from '@/utils/dailyQuests'
import { orchestrateDailyQuestGeneration } from '@/utils/dailyQuestOrchestrator'
import { computeDayRolloverPatches } from '@/utils/progressCoordinator'
import {
  buildDailyPrefsKey,
  dailyPrefsKeysEquivalent,
  dailyQuestIdsMatchPrefs,
} from '@/utils/dailyQuestGenerator'
import { devLog, devWarn } from '@/utils/devLog'

/** Cross-store daily quest sync — keeps useQuestStore free of useUIStore imports. */
export function checkAndGenerateDailyQuests(dateStr?: string): Quest[] {
  const today = dateStr ?? getLocalDateStr()
  const questState = useQuestStore.getState()
  const {
    lastDailyQuestDate,
    quests,
    dailyQuestsIds,
    completedToday,
    lastFavCategories,
  } = questState
  const uiState = useUIStore.getState()
  const { settings } = uiState
  const favKey = buildDailyPrefsKey({
    favoriteCategories: settings.favoriteCategories,
    useRandomCategories: settings.useRandomCategories,
    learningProfile: settings.learningProfile,
  })
  const isSameDay = lastDailyQuestDate === today
  const prefsChanged = !dailyPrefsKeysEquivalent(lastFavCategories, favKey)
  const invalidDailyCategories =
    isSameDay &&
    dailyQuestsIds.length > 0 &&
    !dailyQuestIdsMatchPrefs(dailyQuestsIds, quests, {
      favoriteCategories: settings.favoriteCategories,
      useRandomCategories: settings.useRandomCategories,
      learningProfile: settings.learningProfile,
      dateStr: today,
    })

  devLog('[QuestStore] checkAndGenerate', {
    today,
    lastDailyQuestDate,
    isSameDay,
    prefsChanged,
    invalidDailyCategories,
    completedToday,
  })

  if (!isSameDay || dailyQuestsIds.length === 0 || prefsChanged || invalidDailyCategories) {
    devWarn('[QuestStore] regenerating daily quests', { today, lastDailyQuestDate, isSameDay })
    if (quests.length === 0) {
      devWarn('[QuestStore] no quests loaded yet, skipping daily quest generation')
      return []
    }

    if (!isSameDay) {
      const rolloverPatches = computeDayRolloverPatches(uiState, today)
      if (Object.keys(rolloverPatches).length > 0) {
        useUIStore.setState(rolloverPatches)
      }
    }

    const skillState = useSkillStore.getState()
    const refreshedUi = useUIStore.getState()
    const result = orchestrateDailyQuestGeneration(
      {
        today,
        quests,
        completedQuests: questState.completedQuests,
        completedToday,
        questCompletionLogs: questState.questCompletionLogs,
        dailyQuestsIds,
        lastDailyQuestDate,
        lastFavCategories,
        dailyBonusGrantedDate: questState.dailyBonusGrantedDate,
        settings,
        skillNodes: skillState.skillNodes,
        legacySkills: skillState.legacySkills,
        questReviewSchedule: refreshedUi.questReviewSchedule,
        adaptiveWeights: refreshedUi.adaptiveWeights,
        streakState: refreshedUi.streakState,
        isSameDay,
      },
      favKey,
    )

    useQuestStore.setState({
      dailyQuestsIds: result.dailyQuestsIds,
      lastDailyQuestDate: result.lastDailyQuestDate,
      completedToday: result.completedToday,
      lastFavCategories: result.lastFavCategories,
      dailyBonusGrantedDate: result.dailyBonusGrantedDate,
    })
    if (result.streakStatePatch) {
      useUIStore.setState({ streakState: result.streakStatePatch })
    }
    return result.dailyQuests
  }

  const pruned = reconcileCompletedToday(completedToday, dailyQuestsIds, lastDailyQuestDate, today)
  if (pruned.length !== completedToday.length) {
    useQuestStore.setState({ completedToday: pruned })
  }
  return useQuestStore.getState().getDailyQuests()
}

export function initializeDailyQuests(): Quest[] {
  return checkAndGenerateDailyQuests()
}
