import type { AdaptiveWeights, StreakState } from '@/store/models'
import { useUIStore } from '@/store/useUIStore'
import { penalizeMissedReviews } from '@/utils/questSpacedReview'
import { decayAdaptiveWeights } from '@/utils/adaptiveDifficulty'
import { reconcileStreakOnDayRollover } from '@/utils/dailyQuests'

export type DayRolloverUiPatches = {
  questReviewSchedule?: Record<string, { nextReviewAt: string; intervalDays: number; easeFactor: number }>
  adaptiveWeights?: AdaptiveWeights
  streakState?: StreakState
}

export function computeDayRolloverPatches(
  ui: {
    questReviewSchedule: DayRolloverUiPatches['questReviewSchedule'] & {}
    adaptiveWeights: AdaptiveWeights
    streakState: StreakState
  },
  today: string,
): DayRolloverUiPatches {
  const patches: DayRolloverUiPatches = {}

  const penalized = penalizeMissedReviews(ui.questReviewSchedule, today)
  if (penalized !== ui.questReviewSchedule) {
    patches.questReviewSchedule = penalized
  }

  const decayedWeights = decayAdaptiveWeights(ui.adaptiveWeights)
  if (decayedWeights !== ui.adaptiveWeights) {
    patches.adaptiveWeights = decayedWeights
  }

  const decayedStreak = reconcileStreakOnDayRollover(ui.streakState, today)
  if (decayedStreak) {
    patches.streakState = decayedStreak
  }

  return patches
}

/** Day-rollover UI patches — single entry point for cross-store calendar transitions. */
export function applyDayRolloverPatches(today: string): void {
  const ui = useUIStore.getState()
  const patches = computeDayRolloverPatches(ui, today)
  if (Object.keys(patches).length > 0) {
    useUIStore.setState(patches)
  }
}
