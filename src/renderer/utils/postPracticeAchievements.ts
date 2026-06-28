import type { Quest, QuestCompletionLog, CompletedWork } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'
import { pushAchievements } from '@/store/achievementQueue'

export type QuestProgressSnapshot = {
  quests: Quest[]
  questCompletionLogs: QuestCompletionLog[]
  completedWorks: CompletedWork[]
}

export function getQuestProgressSnapshot(): QuestProgressSnapshot {
  const qs = useQuestStore.getState()
  return {
    quests: qs.quests,
    questCompletionLogs: qs.questCompletionLogs,
    completedWorks: qs.completedWorks,
  }
}

/** Post-skill / post-quest achievement checks without quest store achievement proxies. */
export function runPostPracticeAchievementChecks(snapshot = getQuestProgressSnapshot()): void {
  const skillState = useSkillStore.getState()
  const uiState = useUIStore.getState()
  skillState.checkHiddenAchievements({
    quests: snapshot.quests,
    questCompletionLogs: snapshot.questCompletionLogs,
    streakCurrent: uiState.streakState.current,
  })

  const newAchList = skillState.checkAchievements({
    completedQuests: snapshot.quests,
    completedWorks: snapshot.completedWorks,
    streak: uiState.streakState.current,
    questCompletionLogs: snapshot.questCompletionLogs,
    materialEngagement: uiState.settings.materialEngagement,
  })
  if (newAchList.length > 0) {
    pushAchievements(newAchList)
  }
}
