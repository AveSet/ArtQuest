import { ALL_CATEGORIES, type QuestCategory } from '@/data/skillTree'

export type LearningProfile = 'drawing' | 'animation'

/** Categories hidden when the user focuses on drawing (animation track only). */
export const DRAWING_PROFILE_HIDDEN: QuestCategory[] = ['animation']

export function getVisibleCategories(profile: LearningProfile): QuestCategory[] {
  if (profile === 'drawing') {
    return ALL_CATEGORIES.filter((c) => !DRAWING_PROFILE_HIDDEN.includes(c))
  }
  return [...ALL_CATEGORIES]
}

export function isCategoryVisible(category: QuestCategory, profile: LearningProfile): boolean {
  return getVisibleCategories(profile).includes(category)
}

export function filterByLearningProfile<T extends { category: QuestCategory }>(
  items: readonly T[],
  profile: LearningProfile,
): T[] {
  const visible = new Set(getVisibleCategories(profile))
  return items.filter((item) => visible.has(item.category))
}

export function sanitizeFavoriteCategories(
  favorites: QuestCategory[],
  profile: LearningProfile,
): QuestCategory[] {
  const visible = new Set(getVisibleCategories(profile))
  return favorites.filter((c) => visible.has(c))
}

export function getDefaultFavoriteCategories(profile: LearningProfile): QuestCategory[] {
  if (profile === 'drawing') {
    return sanitizeFavoriteCategories(['drawing', 'anatomy', 'character_design'], profile)
  }
  return sanitizeFavoriteCategories(['drawing', 'anatomy', 'animation'], profile)
}

export function resolveProfileFavoriteCategories(
  favorites: QuestCategory[],
  profile: LearningProfile,
): QuestCategory[] {
  return sanitizeFavoriteCategories(favorites, profile)
}
