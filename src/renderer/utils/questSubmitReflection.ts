import type { QuestFeedbackCriterion } from '@/store/models'

export type DifficultyRating = 1 | 2 | 3 | 4 | 5

export const MISTAKE_TAGS_MIN_DIFFICULTY = 4 as const

export type StrengthRatings = Partial<
  Record<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>
>

export function shouldShowMistakeTags(difficulty: DifficultyRating): boolean {
  return difficulty >= MISTAKE_TAGS_MIN_DIFFICULTY
}

export function shouldShowQualityRatings(difficulty: DifficultyRating): boolean {
  return difficulty < MISTAKE_TAGS_MIN_DIFFICULTY
}

export function isMistakeTagsRequired(difficulty: DifficultyRating): boolean {
  return difficulty >= MISTAKE_TAGS_MIN_DIFFICULTY
}

export function pruneReflectionOnDifficultyChange(
  prev: DifficultyRating,
  next: DifficultyRating,
  state: { mistakeTags: string[]; strengthRatings: StrengthRatings },
): { mistakeTags: string[]; strengthRatings: StrengthRatings } {
  const wasHard = shouldShowMistakeTags(prev)
  const isHard = shouldShowMistakeTags(next)

  if (wasHard && !isHard) {
    return { mistakeTags: [], strengthRatings: state.strengthRatings }
  }
  if (!wasHard && isHard) {
    return { mistakeTags: state.mistakeTags, strengthRatings: {} }
  }
  return state
}

export function isSubmitReflectionValid(
  difficulty: DifficultyRating,
  mistakeTags: string[],
): boolean {
  return !isMistakeTagsRequired(difficulty) || mistakeTags.length > 0
}
