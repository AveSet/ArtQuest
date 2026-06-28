export type QuestDifficulty = 'novice' | 'intermediate' | 'advanced' | 'expert' | 'master'

/** Canonical difficulty order: easiest → hardest */
export const QUEST_DIFFICULTY_ORDER: readonly QuestDifficulty[] = [
  'novice',
  'intermediate',
  'advanced',
  'expert',
  'master',
] as const

export const QUEST_DIFFICULTY_RANK: Record<QuestDifficulty, number> = Object.fromEntries(
  QUEST_DIFFICULTY_ORDER.map((d, i) => [d, i]),
) as Record<QuestDifficulty, number>

export function questDifficultyRank(difficulty: QuestDifficulty): number {
  return QUEST_DIFFICULTY_RANK[difficulty] ?? 99
}

export function compareQuestDifficulty(a: QuestDifficulty, b: QuestDifficulty): number {
  return questDifficultyRank(a) - questDifficultyRank(b)
}
