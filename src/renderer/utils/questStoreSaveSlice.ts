import type { useQuestStore } from '@/store/useQuestStore'

type QuestState = ReturnType<typeof useQuestStore.getState>

function countKeys(record: Record<string, unknown>): number {
  return Object.keys(record).length
}

/** Shallow fingerprint — avoids JSON.stringify of large arrays on every store update. */
export function questStoreSaveFingerprint(state: QuestState): string {
  const lastLog = state.questCompletionLogs[state.questCompletionLogs.length - 1]
  const lastWork = state.completedWorks[state.completedWorks.length - 1]
  const lastUserQuest = state.userQuests[state.userQuests.length - 1]
  const lastCompleted = state.completedQuests[state.completedQuests.length - 1]
  const lastDaily = state.completedToday[state.completedToday.length - 1]
  const lastDailyId = state.dailyQuestsIds[state.dailyQuestsIds.length - 1]
  const lastDeleted = state.deletedQuestIds[state.deletedQuestIds.length - 1]
  const titleOverrideKeys = Object.keys(state.questTitleOverrides).length
  const microKeys = countKeys(state.microChallengesCompleted as Record<string, unknown>)
  const refKeys = countKeys(state.questSavedReferences as Record<string, unknown>)

  return [
    state.completedQuests.length,
    lastCompleted ?? '',
    state.questCompletionLogs.length,
    lastLog?.completedAt ?? '',
    lastLog?.questId ?? '',
    state.completedWorks.length,
    lastWork?.id ?? '',
    lastWork?.savedPath ?? '',
    state.userQuests.length,
    lastUserQuest?.id ?? '',
    state.deletedQuestIds.length,
    lastDeleted ?? '',
    titleOverrideKeys,
    microKeys,
    refKeys,
    state.dailyQuestsIds.length,
    lastDailyId ?? '',
    state.completedToday.length,
    lastDaily ?? '',
    state.lastDailyQuestDate,
    state.lastFavCategories,
    state.dailyBonusGrantedDate,
    state.weeklyChallengeWeek,
    state.weeklyChallengeQuestId ?? '',
    state.weeklyChallengeCompletedWeek,
    state.lastWarmupCompletedDate,
    state.fundamentalsProgress?.completedIds?.length ?? 0,
    state.fundamentalsProgress?.completedIds?.[state.fundamentalsProgress.completedIds.length - 1] ?? '',
  ].join('|')
}
