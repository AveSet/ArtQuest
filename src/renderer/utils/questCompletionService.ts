import type { QuestCategory } from '@/data/skillTree'
import type { Quest, QuestCompletionLog, QuestFeedback } from '@/store/models'
import { useUIStore } from '@/store/useUIStore'
import { useXpFloatStore } from '@/store/xpFloatStore'
import { reconcileCompletedToday, getLocalDateStr } from '@/utils/dailyQuests'
import { playSound } from '@/utils/sound'
import { distributeQuestXp, distributePhaseNodeXp } from '@/utils/questXpReward'
import { computePhaseNodeXp } from '@/utils/microChallengeXp'
import {
  runQuestCompletionEffects,
  type QuestCompletionEffectsInput,
} from '@/utils/questCompletionPipeline'

export type SimpleQuestCompletionInput = {
  quest: Quest
  questId: number
  practiceMinutes: number
  notes?: string
  feedback?: QuestFeedback
  forceSpeedRunFalse?: boolean
}

export type SimpleQuestCompletionResult = {
  logEntry: QuestCompletionLog
  trackXp: number
  nodeXp: number
  rewardCategory: Quest['category']
  practiceMinutes: number
  isSpeedRun: boolean
}

export type CatalogQuestCompletionInput = {
  quest: Quest
  questId: number
  questXp: number
  rewardCategory: QuestCategory
  practiceMinutes: number
  targetSkillNodeId?: string
  notes?: string
  feedback?: QuestFeedback
  isOvertime?: boolean
}

/** Shared XP + log construction for warmup, fundamentals, and catalog completions. */
export function buildSimpleQuestCompletion(
  input: SimpleQuestCompletionInput,
): SimpleQuestCompletionResult {
  const { quest, questId, practiceMinutes, notes, feedback, forceSpeedRunFalse } = input
  const rewardCategory = quest.category
  const isSpeedRun =
    forceSpeedRunFalse === true
      ? false
      : quest.estimatedTime > 0 && practiceMinutes > 0 && practiceMinutes < quest.estimatedTime / 2
  const { trackXp, nodeXp } = distributeQuestXp(quest.xp, rewardCategory, {
    tags: quest.tags,
    practiceMinutes,
    estimatedTime: quest.estimatedTime,
    isSpeedRun,
  })

  const logEntry: QuestCompletionLog = {
    questId,
    nodeId: '',
    completedAt: new Date().toISOString(),
    xpEarned: trackXp + nodeXp,
    difficulty: quest.difficulty,
    practiceMinutes,
    isSpeedRun: forceSpeedRunFalse === true ? false : isSpeedRun,
    category: rewardCategory,
    notes: notes?.trim() || undefined,
    feedback,
  }

  return {
    logEntry,
    trackXp,
    nodeXp,
    rewardCategory,
    practiceMinutes,
    isSpeedRun: forceSpeedRunFalse === true ? false : isSpeedRun,
  }
}

export function buildCatalogQuestCompletion(
  input: CatalogQuestCompletionInput,
): SimpleQuestCompletionResult {
  const {
    quest,
    questId,
    questXp,
    rewardCategory,
    practiceMinutes,
    targetSkillNodeId,
    notes,
    feedback,
    isOvertime,
  } = input
  const isSpeedRun = quest.estimatedTime > 0 && practiceMinutes > 0 && practiceMinutes < quest.estimatedTime / 2
  const { trackXp, nodeXp } =
    rewardCategory || targetSkillNodeId
      ? distributeQuestXp(questXp, rewardCategory, {
          targetSkillNodeId,
          tags: quest.tags,
          practiceMinutes,
          estimatedTime: quest.estimatedTime,
          isSpeedRun,
          isOvertime,
        })
      : { trackXp: 0, nodeXp: 0 }

  const logEntry: QuestCompletionLog = {
    questId,
    nodeId: targetSkillNodeId || '',
    completedAt: new Date().toISOString(),
    xpEarned: trackXp + nodeXp,
    difficulty: quest.difficulty,
    practiceMinutes,
    isSpeedRun,
    category: rewardCategory,
    notes: notes?.trim() || undefined,
    feedback,
  }

  return {
    logEntry,
    trackXp,
    nodeXp,
    rewardCategory,
    practiceMinutes,
    isSpeedRun,
  }
}

export function runQuestCompletionPipeline(input: QuestCompletionEffectsInput): void {
  runQuestCompletionEffects(input)
}

export type LastCompletionRewardState = {
  questXp: number
  skillXp: number
  category?: string
}

export function buildLastCompletionReward(
  trackXp: number,
  nodeXp: number,
  category: Quest['category'],
): LastCompletionRewardState | null {
  return trackXp > 0 || nodeXp > 0
    ? { questXp: trackXp, skillXp: nodeXp, category }
    : null
}

export function appendQuestCompletionLogPatch(
  state: { questCompletionLogs: QuestCompletionLog[] },
  input: {
    trackXp: number
    nodeXp: number
    rewardCategory: Quest['category']
    logEntry: QuestCompletionLog
  },
) {
  return {
    lastCompletionReward: buildLastCompletionReward(
      input.trackXp,
      input.nodeXp,
      input.rewardCategory,
    ),
    questCompletionLogs: [...state.questCompletionLogs, input.logEntry],
  }
}

export type CatalogQuestCompletionStateSlice = {
  completedQuests: number[]
  completedToday: number[]
  dailyQuestsIds: number[]
  lastDailyQuestDate: string
  questCompletionLogs: QuestCompletionLog[]
}

export function buildCatalogQuestCompletionPatch(
  state: CatalogQuestCompletionStateSlice,
  input: {
    quest: Quest
    questId: number
    trackXp: number
    nodeXp: number
    rewardCategory: QuestCategory
    logEntry: QuestCompletionLog
    today?: string
  },
) {
  const today = input.today ?? getLocalDateStr()
  const isNewDay = state.lastDailyQuestDate !== today
  const isDailyQuest = state.dailyQuestsIds.includes(input.questId)
  let newCompletedToday = reconcileCompletedToday(
    state.completedToday,
    state.dailyQuestsIds,
    state.lastDailyQuestDate,
    today,
  )

  if (isDailyQuest && !newCompletedToday.includes(input.questId)) {
    newCompletedToday = isNewDay ? [input.questId] : [...newCompletedToday, input.questId]
  } else if (isNewDay) {
    newCompletedToday = []
  }

  return {
    completedQuests: input.quest.is_repeatable
      ? state.completedQuests
      : [...state.completedQuests, input.questId],
    completedToday: newCompletedToday,
    lastDailyQuestDate: today,
    lastCompletionReward: buildLastCompletionReward(
      input.trackXp,
      input.nodeXp,
      input.rewardCategory,
    ),
    questCompletionLogs: [...state.questCompletionLogs, input.logEntry],
  }
}

export function buildQuestTimeoutLogEntry(
  quest: Quest,
  questId: number,
  practiceMinutes: number,
  trackXp: number,
  nodeXp: number,
): QuestCompletionLog {
  return {
    questId,
    nodeId: '',
    completedAt: new Date().toISOString(),
    xpEarned: trackXp + nodeXp,
    difficulty: quest.difficulty,
    practiceMinutes,
    category: quest.category,
    status: 'timeout',
  }
}

export function emitQuestCompletionXpFloat(trackXp: number, nodeXp = 0): void {
  const amount = trackXp + nodeXp
  if (amount > 0) useXpFloatStore.getState().push(amount)
}

export type FinalizeQuestCompletionInput = QuestCompletionEffectsInput & {
  playCompleteSound?: boolean
}

/** XP float, optional complete SFX, then post-completion orchestration. */
export function finalizeQuestCompletion(input: FinalizeQuestCompletionInput): void {
  emitQuestCompletionXpFloat(input.trackXp, input.nodeXp)
  if (input.playCompleteSound && input.rewardCategory) {
    playSound('complete', input.rewardCategory)
  }
  runQuestCompletionEffects(input)
  useUIStore.getState().saveProgressSync()
}

export type MicroChallengeCompletionOptions = {
  silent?: boolean
  skipXp?: boolean
}

export function buildMicroChallengeCompletionPatch(
  state: { microChallengesCompleted: Record<string, string[]> },
  questId: number,
  challengeId: string,
): { microChallengesCompleted: Record<string, string[]> } | null {
  const key = String(questId)
  const prev = state.microChallengesCompleted[key] ?? []
  if (prev.includes(challengeId)) return null
  return {
    microChallengesCompleted: {
      ...state.microChallengesCompleted,
      [key]: [...prev, challengeId],
    },
  }
}

export function awardMicroChallengePhaseXp(quest: Quest, challengeId: string): number {
  const challenge = quest.microChallenges?.find((mc) => mc.id === challengeId)
  if (!challenge) return 0
  const phaseXp = computePhaseNodeXp(quest, challengeId)
  if (phaseXp > 0) {
    distributePhaseNodeXp(phaseXp, quest.category, { tags: quest.tags })
    emitQuestCompletionXpFloat(phaseXp)
  }
  return phaseXp
}

export function playMicroChallengeCompleteSound(quest: Quest, opts?: MicroChallengeCompletionOptions): void {
  if (!opts?.silent) playSound('complete', quest.category)
}
