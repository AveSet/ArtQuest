import type { QuestCategory } from '@/data/skillTree'
import type { Quest, QuestCompletionLog, QuestFeedback } from '@/store/models'
import { pushAchievements } from '@/store/achievementQueue'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import {
  areAllDailyQuestsCompleted,
  calendarDaysBetween,
  getLocalDateStr,
  resolveDailyQuestSlots,
} from '@/utils/dailyQuests'
import { distributeQuestXp } from '@/utils/questXpReward'
import { getIsoWeekKey } from '@/utils/weeklyChallenge'
import { dispatchFeedbackMoment } from '@/utils/feedbackOrchestrator'
import { computeFlowMetrics, updateAdaptiveWeights } from '@/utils/adaptiveDifficulty'
import { scheduleNextReview } from '@/utils/questSpacedReview'
import { aggregateFeedbackStats } from '@/utils/feedbackAnalytics'
import { canonicalAdaptiveTag, relatedQuestTagsForMistakes } from '@/utils/mistakeTags'
import {
  DAILY_COMPLETION_BONUS_MULTIPLIER,
  REWARD_XP_FLOAT_MIN,
  WEEKLY_CHALLENGE_BONUS_MIN,
  WEEKLY_CHALLENGE_BONUS_MULTIPLIER,
} from '@/utils/rewardLoopConstants'

export type QuestCompletionEffectsInput = {
  questId: number
  quest: Quest
  logEntry: QuestCompletionLog
  trackXp: number
  nodeXp: number
  rewardCategory: QuestCategory | undefined
  practiceMinutes: number
  isSpeedRun: boolean
  targetSkillNodeId?: string
  feedback?: QuestFeedback
}

function addBonusXpToLastQuestLog(questId: number, bonusXp: number): void {
  if (bonusXp <= 0) return
  useQuestStore.setState((state) => {
    const logs = state.questCompletionLogs
    if (logs.length === 0) return {}
    const last = logs[logs.length - 1]!
    if (last.questId !== questId) return {}
    const next = [...logs]
    next[next.length - 1] = { ...last, xpEarned: last.xpEarned + bonusXp }
    return { questCompletionLogs: next }
  })
}

function updateDailyStreakWhenAllDailiesDone(today: string): void {
  const streakState = useUIStore.getState().streakState
  if (streakState.lastActiveDate === today) return

  const gap =
    streakState.lastActiveDate === '' ? -1 : calendarDaysBetween(streakState.lastActiveDate, today)

  if (streakState.streakRecoveryDueDate === today && streakState.current > 0) {
    const current = streakState.current + 1
    useUIStore.setState({
      streakState: {
        ...streakState,
        current,
        longest: Math.max(streakState.longest, current),
        lastActiveDate: today,
        streakRecoveryDueDate: undefined,
      },
    })
    return
  }

  if (gap <= 1 || gap === -1) {
    const current = streakState.lastActiveDate === '' ? 1 : streakState.current + 1
    useUIStore.setState({
      streakState: {
        ...streakState,
        current,
        longest: Math.max(streakState.longest, current),
        lastActiveDate: today,
        streakRecoveryDueDate: undefined,
      },
    })
    return
  }

  useUIStore.setState({
    streakState: {
      ...streakState,
      current: 1,
      longest: streakState.longest,
      lastActiveDate: today,
      streakRecoveryDueDate: undefined,
    },
  })
}

/** Post-completion orchestration: bonuses, achievements, adaptive weights, streak, portrait. */
export function runQuestCompletionEffects(input: QuestCompletionEffectsInput): void {
  const {
    questId,
    quest,
    logEntry,
    trackXp,
    nodeXp,
    rewardCategory,
    practiceMinutes,
    isSpeedRun,
    targetSkillNodeId,
    feedback,
  } = input
  const today = getLocalDateStr()
  const questStore = useQuestStore.getState()

  useSkillStore.getState().markSkillNodesReviewed(quest.category, quest.tags)
  const skillState = useSkillStore.getState()
  const questSnapshot = {
    quests: questStore.quests,
    questCompletionLogs: questStore.questCompletionLogs,
  }
  const uiState = useUIStore.getState()
  skillState.checkHiddenAchievements({
    ...questSnapshot,
    streakCurrent: uiState.streakState.current,
  })

  const { completedToday, dailyQuestsIds, dailyBonusGrantedDate } = questStore
  const allDailiesDone =
    dailyQuestsIds.includes(questId) &&
    areAllDailyQuestsCompleted(dailyQuestsIds, completedToday) &&
    dailyBonusGrantedDate !== today

  if (allDailiesDone) {
    questStore.ensureWeeklyChallenge()
    dispatchFeedbackMoment({ kind: 'daily_complete', category: rewardCategory })
    const bonusXp = Math.round((trackXp + nodeXp) * DAILY_COMPLETION_BONUS_MULTIPLIER)
    if (bonusXp > 0 && rewardCategory) {
      distributeQuestXp(bonusXp, rewardCategory, {
        targetSkillNodeId,
        tags: quest.tags,
        practiceMinutes,
        estimatedTime: quest.estimatedTime,
        isSpeedRun,
      })
      const prevReward = useQuestStore.getState().lastCompletionReward
      useQuestStore.setState({
        dailyBonusGrantedDate: today,
        lastCompletionReward: {
          questXp: prevReward?.questXp ?? trackXp,
          skillXp: prevReward?.skillXp ?? nodeXp,
          category: rewardCategory,
          bonusDailyXp: bonusXp,
          bonusWeeklyXp: prevReward?.bonusWeeklyXp,
        },
      })
      addBonusXpToLastQuestLog(questId, bonusXp)
      if (bonusXp >= REWARD_XP_FLOAT_MIN) {
        dispatchFeedbackMoment({ kind: 'xp_float', amount: bonusXp })
      }
    } else {
      useQuestStore.setState({ dailyBonusGrantedDate: today })
    }
    const portrait = usePortraitStore.getState()
    const streakState = useUIStore.getState().streakState
    const requiredDailySlots = resolveDailyQuestSlots(streakState, today)
    const canUseShieldForRecovery =
      streakState.streakRecoveryDueDate === today && dailyQuestsIds.length >= requiredDailySlots
    const useShield = canUseShieldForRecovery ? portrait.tryConsumeShieldForMissedDay(today) : false
    portrait.recordAllDailiesComplete(today, { useStreakShield: useShield })
    updateDailyStreakWhenAllDailiesDone(today)
  }

  const { quests, completedWorks, questCompletionLogs } = useQuestStore.getState()
  const newAchList = skillState.checkAchievements({
    completedQuests: quests,
    completedWorks,
    streak: uiState.streakState.current,
    questCompletionLogs,
    materialEngagement: uiState.settings.materialEngagement,
  })
  if (newAchList.length > 0) {
    pushAchievements(newAchList)
  }

  const weekKey = getIsoWeekKey()
  const { weeklyChallengeQuestId, weeklyChallengeCompletedWeek } = useQuestStore.getState()
  const weeklyJustDone =
    weeklyChallengeQuestId === questId && weeklyChallengeCompletedWeek !== weekKey

  if (weeklyJustDone) {
    dispatchFeedbackMoment({ kind: 'weekly_complete', category: rewardCategory })
    const bonusXp = Math.max(
      WEEKLY_CHALLENGE_BONUS_MIN,
      Math.round((trackXp + nodeXp) * WEEKLY_CHALLENGE_BONUS_MULTIPLIER),
    )
    if (bonusXp > 0 && rewardCategory) {
      distributeQuestXp(bonusXp, rewardCategory, {
        targetSkillNodeId,
        tags: quest.tags,
        practiceMinutes,
        estimatedTime: quest.estimatedTime,
        isSpeedRun,
      })
    }
    const prev = useQuestStore.getState().lastCompletionReward
    useQuestStore.setState({
      weeklyChallengeCompletedWeek: weekKey,
      lastCompletionReward: {
        questXp: prev?.questXp ?? trackXp,
        skillXp: prev?.skillXp ?? nodeXp,
        category: rewardCategory,
        bonusDailyXp: prev?.bonusDailyXp,
        bonusWeeklyXp: bonusXp,
      },
    })
    addBonusXpToLastQuestLog(questId, bonusXp)
    if (bonusXp >= REWARD_XP_FLOAT_MIN) {
      dispatchFeedbackMoment({ kind: 'xp_float', amount: bonusXp })
    }
  }

  const { questCompletionLogs: allLogs, quests: allQuests } = useQuestStore.getState()
  const metrics = computeFlowMetrics(allLogs, allQuests)
  const currentWeights = useUIStore.getState().adaptiveWeights
  const newWeights = updateAdaptiveWeights(currentWeights, metrics)
  useUIStore.setState({ adaptiveWeights: newWeights })

  const questForReview = allQuests.find((q) => q.id === questId)
  if (questForReview && (questForReview.review_after_days ?? 0) > 0) {
    const ui = useUIStore.getState()
    useUIStore.setState({
      questReviewSchedule: scheduleNextReview(
        ui.questReviewSchedule,
        questId,
        questForReview.review_after_days,
        logEntry.completedAt,
      ),
    })
  }

  if (feedback) {
    const stats = aggregateFeedbackStats(useQuestStore.getState().questCompletionLogs)
    const mistakeQuestTags = relatedQuestTagsForMistakes(feedback.mistakeTags ?? [])
    const current = useUIStore.getState().adaptiveWeights
    const nextWeights = { ...current }
    for (const tag of mistakeQuestTags) {
      const key = canonicalAdaptiveTag(tag)
      nextWeights[key] = Math.min(1.8, Math.round(((nextWeights[key] ?? 1) + 0.2) * 100) / 100)
    }
    useUIStore.setState({ feedbackStats: stats, adaptiveWeights: nextWeights })
  }

  useUIStore.getState().triggerPortraitCelebrate(rewardCategory ?? quest.category)
}
