export const FULL_REFLECTION_EVERY_N = 5

export type ReflectionSamplingInput = {
  /** Total catalog quest completions (non-warmup/fundamentals). */
  completedQuestCount: number
  isOvertime: boolean
  isSpeedRun: boolean
}

/** Full reflection (tags + quality) on triggers or every Nth quest; otherwise micro difficulty only. */
export function shouldUseFullReflection(input: ReflectionSamplingInput): boolean {
  if (input.isOvertime || input.isSpeedRun) return true
  if (input.completedQuestCount <= 0) return true
  return input.completedQuestCount % FULL_REFLECTION_EVERY_N === 0
}

export function isSubmitReflectionValidCompact(difficulty: 1 | 2 | 3 | 4 | 5): boolean {
  return difficulty >= 1 && difficulty <= 5
}
