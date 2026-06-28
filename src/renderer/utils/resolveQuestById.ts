import {
  getFundamentalsQuestById,
  isFundamentalsTrackId,
} from '@/data/fundamentalsExercises'
import { getWarmupQuestById, isWarmupQuestId } from '@/data/warmupQuests'
import type { Quest } from '@/store/models'
import {
  resolveFundamentalsTrackSessionStart,
  type FundamentalsProgress,
} from '@/utils/fundamentalsProgress'

export function resolveQuestById(questId: number, quests: readonly Quest[]): Quest | undefined {
  return (
    quests.find((q) => q.id === questId) ??
    getFundamentalsQuestById(questId) ??
    getWarmupQuestById(questId)
  )
}

const EMPTY_FUNDAMENTALS_PROGRESS: FundamentalsProgress = {
  completedIds: [],
  trackPhaseDone: {},
  lastCompletedDate: '',
}

/** Route state so returning to a warmup/fundamentals quest restores quick-start session UX. */
export function buildQuestDetailNavState(
  questId: number,
  options?: { autoStart?: boolean },
): Record<string, unknown> | undefined {
  if (options?.autoStart === false) return undefined
  if (isWarmupQuestId(questId)) {
    return { quickStartMinutes: 5, isWarmupSession: true }
  }
  const fundamentals = getFundamentalsQuestById(questId)
  if (fundamentals) {
    const trackStart = isFundamentalsTrackId(questId)
      ? resolveFundamentalsTrackSessionStart(questId, EMPTY_FUNDAMENTALS_PROGRESS)
      : undefined
    return {
      quickStartMinutes: trackStart?.mainMinutesOverride ?? fundamentals.estimatedTime,
      isFundamentalsSession: true,
    }
  }
  return undefined
}
