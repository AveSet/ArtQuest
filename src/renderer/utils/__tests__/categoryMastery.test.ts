import { describe, it, expect } from 'vitest'
import { computeCategoryMastery } from '../categoryMastery'
import type { SkillNode } from '@/store/models'

function node(category: SkillNode['category'], level: number, xp = 0): SkillNode {
  return {
    id: `${category}_n`,
    parentId: null,
    category,
    title: { en: 'N', ru: 'N', zh: 'N', ja: 'N', ko: 'N' },
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    level,
    xp,
    maxXp: 290,
    prerequisites: [],
    tags: [],
    reviewIntervalDays: 0,
    lastReviewDate: null,
    isUnlocked: true,
    order: 0,
    prestige: 0,
  }
}

describe('computeCategoryMastery', () => {
  it('returns 7 categories with bounded percent', () => {
    const points = computeCategoryMastery([node('drawing', 5, 100)])
    expect(points).toHaveLength(7)
    const drawing = points.find((p) => p.category === 'drawing')!
    expect(drawing.percent).toBeGreaterThan(0)
    expect(drawing.percent).toBeLessThanOrEqual(100)
  })
})
