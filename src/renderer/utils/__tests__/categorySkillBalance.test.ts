import { describe, it, expect } from 'vitest'
import {
  dailyCategoryRoll,
  pickWeightedRecommendationCategory,
} from '../categorySkillBalance'
import type { SkillNode } from '@/store/models'

const node = (category: SkillNode['category'], level: number): SkillNode => ({
  id: `${category}-1`,
  parentId: null,
  category,
  title: { en: 'n', ru: 'n', zh: 'n', ja: 'n', ko: 'n' },
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  level,
  xp: level * 10,
  maxXp: 100,
  prerequisites: [],
  tags: [],
  reviewIntervalDays: 0,
  lastReviewDate: null,
  isUnlocked: true,
  order: 0,
  prestige: 0,
})

describe('pickWeightedRecommendationCategory', () => {
  it('returns weakest category on low roll', () => {
    const skillNodes = [
      node('drawing', 1),
      node('anatomy', 5),
      node('animation', 3),
    ]
    const rollSpy = dailyCategoryRoll('2026-06-07')
    expect(rollSpy).toBeGreaterThanOrEqual(0)
    if (rollSpy < 60) {
      expect(
        pickWeightedRecommendationCategory(skillNodes, ['drawing', 'anatomy', 'animation'], '2026-06-07'),
      ).toBe('drawing')
    }
  })

  it('is stable for the same date', () => {
    const skillNodes = [node('drawing', 1), node('anatomy', 4)]
    const a = pickWeightedRecommendationCategory(skillNodes, ['drawing', 'anatomy'], '2026-06-07')
    const b = pickWeightedRecommendationCategory(skillNodes, ['drawing', 'anatomy'], '2026-06-07')
    expect(a).toBe(b)
  })
})
