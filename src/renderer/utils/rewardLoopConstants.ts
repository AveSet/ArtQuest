/**
 * Central reward-loop pacing constants and golden-case helpers.
 * Adjust one lever at a time; tests lock expected outputs for canonical scenarios.
 */
import {
  computePracticeOnlyXp,
  computeQuestNodeShareXp,
  computeQuestTrackXp,
  OVERTIME_TRACK_XP_MULTIPLIER,
  PRACTICE_MAX_CAPPED_MINUTES,
  PRACTICE_MODE_XP_PER_MINUTE,
  QUEST_NODE_XP_RATIO,
} from './progressionBalance'

/** Multiplier applied to (track + node) XP when all daily quests finish the same day. */
export const DAILY_COMPLETION_BONUS_MULTIPLIER = 0.35

/** Multiplier applied to (track + node) XP for the weekly challenge quest. */
export const WEEKLY_CHALLENGE_BONUS_MULTIPLIER = 0.55

/** Minimum weekly challenge bonus XP (after multiplier). */
export const WEEKLY_CHALLENGE_BONUS_MIN = 80

/** Skip floating +XP labels below this amount (micro rewards stay in toast only). */
export const REWARD_XP_FLOAT_MIN = 12

/** XP float visual tier breakpoints (softened vs raw quest face values). */
export const XP_FLOAT_TIER_SILVER = 60
export const XP_FLOAT_TIER_GOLD = 120

/** Toast highlight threshold for bonus lines (daily/weekly). */
export const REWARD_TOAST_BONUS_HIGHLIGHT_MIN = 25

export type ReferenceQuestRewardCase = {
  name: string
  questXp: number
  practiceMinutes: number
  estimatedTime: number
  isOvertime?: boolean
  isSpeedRun?: boolean
  dailyBonusBase?: number
  weeklyBonusBase?: number
}

export type ReferenceQuestRewardExpectation = {
  trackXp: number
  nodeXp: number
  dailyBonusXp: number
  weeklyBonusXp: number
  practiceXp: number
}

export function computeReferenceQuestRewards(input: ReferenceQuestRewardCase): ReferenceQuestRewardExpectation {
  const trackXp = computeQuestTrackXp(input.questXp, {
    practiceMinutes: input.practiceMinutes,
    estimatedTime: input.estimatedTime,
    isOvertime: input.isOvertime,
    isSpeedRun: input.isSpeedRun,
  })
  const nodeXp = computeQuestNodeShareXp(input.questXp)
  const base = trackXp + nodeXp
  const dailyBonusBase = input.dailyBonusBase ?? base
  const weeklyBonusBase = input.weeklyBonusBase ?? base
  const dailyBonusXp =
    dailyBonusBase > 0 ? Math.round(dailyBonusBase * DAILY_COMPLETION_BONUS_MULTIPLIER) : 0
  const weeklyBonusXp =
    weeklyBonusBase > 0
      ? Math.max(WEEKLY_CHALLENGE_BONUS_MIN, Math.round(weeklyBonusBase * WEEKLY_CHALLENGE_BONUS_MULTIPLIER))
      : 0
  const practiceXp = computePracticeOnlyXp(input.practiceMinutes)
  return { trackXp, nodeXp, dailyBonusXp, weeklyBonusXp, practiceXp }
}

export const REFERENCE_QUEST_REWARD_CASES: ReferenceQuestRewardCase[] = [
  {
    name: 'normal completion',
    questXp: 40,
    practiceMinutes: 20,
    estimatedTime: 20,
  },
  {
    name: 'overtime completion',
    questXp: 40,
    practiceMinutes: 25,
    estimatedTime: 20,
    isOvertime: true,
  },
  {
    name: 'speed-run completion',
    questXp: 40,
    practiceMinutes: 8,
    estimatedTime: 20,
    isSpeedRun: true,
  },
  {
    name: 'all dailies complete bonus',
    questXp: 30,
    practiceMinutes: 15,
    estimatedTime: 15,
    dailyBonusBase: 36,
  },
  {
    name: 'weekly challenge bonus',
    questXp: 55,
    practiceMinutes: 30,
    estimatedTime: 30,
    weeklyBonusBase: 66,
  },
  {
    name: 'long practice session',
    questXp: 0,
    practiceMinutes: 90,
    estimatedTime: 45,
  },
]

export {
  OVERTIME_TRACK_XP_MULTIPLIER,
  PRACTICE_MAX_CAPPED_MINUTES,
  PRACTICE_MODE_XP_PER_MINUTE,
  QUEST_NODE_XP_RATIO,
}
