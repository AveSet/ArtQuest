/**
 * Shared helpers for YouTube-inspired quest generation.
 */

export type Category =
  | 'drawing'
  | 'anatomy'
  | 'animation'
  | 'effects'
  | 'storytelling'
  | 'character_design'
  | 'environment'

export type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'master' | 'expert'
export type Medium = 'traditional' | 'digital' | 'both'

export interface MicroChallengeDraft {
  id: string
  instruction: { en: string; ru: string }
  estimatedTime: number
  xp: number
  prerequisite?: string
}

export interface QuestDraft {
  id: number
  category: Category
  difficulty: Difficulty
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  xp: number
  estimatedTime: number
  min_level: number
  tags: string[]
  medium: Medium
  is_repeatable: boolean
  review_after_days: number
  source: string
  /** ResourceChannelKey — documentation only */
  inspiredBy: string
  prerequisites?: number[]
  microChallenges: MicroChallengeDraft[]
}

export function mc(
  slug: string,
  warmup: { en: string; ru: string },
  core: { en: string; ru: string },
  polish: { en: string; ru: string },
  times: [number, number, number] = [5, 12, 8],
  xp: [number, number, number] = [5, 10, 14],
): MicroChallengeDraft[] {
  const w = `mc-yt-${slug}-warmup`
  const c = `mc-yt-${slug}-core`
  const p = `mc-yt-${slug}-polish`
  return [
    { id: w, instruction: warmup, estimatedTime: times[0], xp: xp[0] },
    { id: c, instruction: core, estimatedTime: times[1], xp: xp[1], prerequisite: w },
    { id: p, instruction: polish, estimatedTime: times[2], xp: xp[2], prerequisite: c },
  ]
}

export function makeQuest(params: Omit<QuestDraft, 'microChallenges'> & { microSlug: string }): QuestDraft {
  const baseSlug = `${params.id}-${params.microSlug}`
  return {
    ...params,
    microChallenges: mc(
      baseSlug,
      { en: 'Warm up: 2 quick attempts', ru: 'Разминка: 2 быстрые попытки' },
      { en: 'Main exercise from quest description', ru: 'Основное упражнение из описания' },
      { en: 'Polish best result once', ru: 'Один проход полировки лучшего результата' },
    ),
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
