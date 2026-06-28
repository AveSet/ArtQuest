import type { QuestCategory } from '@/data/skillTree'

/** CSS custom properties matching skill bar fills in skills.css */
export const SKILL_CATEGORY_COLORS: Record<QuestCategory, string> = {
  drawing: 'var(--color-drawing)',
  anatomy: 'var(--color-anatomy)',
  animation: 'var(--color-animation)',
  effects: 'var(--color-effects)',
  storytelling: 'var(--color-storytelling)',
  character_design: 'var(--color-character-design)',
  environment: 'var(--color-environment)',
}

export function skillCategoryColor(category: string): string {
  if (category in SKILL_CATEGORY_COLORS) {
    return SKILL_CATEGORY_COLORS[category as QuestCategory]
  }
  return 'var(--accent)'
}

export function skillCategoryBarClass(category: string): string {
  if (category in SKILL_CATEGORY_COLORS) {
    return `skill-bar-fill skill-bar-fill--${category}`
  }
  return 'skill-bar-fill'
}
