import { describe, it, expect } from 'vitest'
import { computePlayerLevel, getPlayerRankKey } from '../playerLevel'
import type { SkillNode } from '@/store/models'

function node(category: SkillNode['category'], level: number, prestige = 0): SkillNode {
  return {
    id: `${category}_${level}`,
    parentId: null,
    category,
    title: { en: 'n', ru: 'н', zh: 'n', ja: 'n', ko: 'n' },
    description: { en: 'd', ru: 'д', zh: 'd', ja: 'd', ko: 'd' },
    level,
    xp: 0,
    maxXp: 100,
    prerequisites: [],
    tags: [],
    reviewIntervalDays: 0,
    lastReviewDate: null,
    isUnlocked: level > 0,
    order: 0,
    prestige,
  }
}

describe('computePlayerLevel', () => {
  it('returns 0 for default legacy skills', () => {
    const nodes = [node('drawing', 0)]
    const legacy = [
      { category: 'drawing' as const, name: 'Drawing', level: 0, xp: 0, maxXp: 100, color: '#6366f1', icon: '✏️' },
      { category: 'anatomy' as const, name: 'Anatomy', level: 0, xp: 0, maxXp: 100, color: '#ec4899', icon: '🦴' },
    ]
    expect(computePlayerLevel(nodes, legacy)).toBe(0)
  })

  it('sums legacy sidebar skill levels when provided', () => {
    const nodes = [node('drawing', 10, 1)]
    const legacy = [
      { category: 'drawing' as const, name: 'Drawing', level: 4, xp: 0, maxXp: 100, color: '#6366f1', icon: '✏️' },
      { category: 'anatomy' as const, name: 'Anatomy', level: 3, xp: 0, maxXp: 100, color: '#ec4899', icon: '🦴' },
    ]
    expect(computePlayerLevel(nodes, legacy)).toBe(7)
  })

  it('sums peak level per category when legacy skills are absent', () => {
    const nodes = [
      node('drawing', 3),
      node('drawing', 1),
      node('anatomy', 2),
      node('animation', 0),
    ]
    expect(computePlayerLevel(nodes)).toBe(5)
  })

  it('uses effective level with prestige when legacy skills are absent', () => {
    const nodes = [node('drawing', 10, 1)]
    expect(computePlayerLevel(nodes)).toBe(20)
  })
})

describe('getPlayerRankKey', () => {
  it('maps rank thresholds', () => {
    expect(getPlayerRankKey(0)).toBe('novice')
    expect(getPlayerRankKey(3)).toBe('novice')
    expect(getPlayerRankKey(4)).toBe('apprentice')
    expect(getPlayerRankKey(8)).toBe('journeyman')
    expect(getPlayerRankKey(13)).toBe('master')
    expect(getPlayerRankKey(21)).toBe('legend')
  })
})
