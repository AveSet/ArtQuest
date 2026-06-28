import { describe, it, expect } from 'vitest'
import { applyPrerequisiteUnlocks, effectiveNodeLevel } from '../skillUnlocks'
import type { SkillNode } from '@/store/models'
import { NODE_MAX_LEVEL } from '@/utils/progressionBalance'

function mockNode(overrides: Partial<SkillNode>): SkillNode {
  return {
    id: 'drawing_fundamentals',
    parentId: null,
    title: { en: 'Fundamentals', ru: 'Основы', zh: 'Fundamentals', ja: 'Fundamentals', ko: 'Fundamentals' },
    description: { en: 'Fundamentals', ru: 'Основы', zh: 'Fundamentals', ja: 'Fundamentals', ko: 'Fundamentals' },
    category: 'drawing',
    level: 0,
    xp: 0,
    maxXp: 290,
    prestige: 0,
    prerequisites: [],
    tags: [],
    isUnlocked: true,
    lastReviewDate: null,
    reviewIntervalDays: 7,
    order: 0,
    ...overrides,
  }
}

describe('applyPrerequisiteUnlocks', () => {
  it('unlocks row-0 nodes with no prerequisites', () => {
    const nodes = applyPrerequisiteUnlocks([
      mockNode({ id: 'drawing_fundamentals', prerequisites: [] }),
    ])
    expect(nodes[0]?.isUnlocked).toBe(true)
  })

  it('locks row-1 nodes until prerequisite effective level >= 1', () => {
    const nodes = applyPrerequisiteUnlocks([
      mockNode({ id: 'drawing_fundamentals', prerequisites: [], level: 0 }),
      mockNode({
        id: 'drawing_perspective',
        prerequisites: ['drawing_fundamentals'],
        level: 0,
        isUnlocked: false,
      }),
    ])
    expect(nodes.find((n) => n.id === 'drawing_perspective')?.isUnlocked).toBe(false)

    const leveled = applyPrerequisiteUnlocks([
      mockNode({ id: 'drawing_fundamentals', prerequisites: [], level: 1 }),
      mockNode({
        id: 'drawing_perspective',
        prerequisites: ['drawing_fundamentals'],
        level: 0,
        isUnlocked: false,
      }),
    ])
    expect(leveled.find((n) => n.id === 'drawing_perspective')?.isUnlocked).toBe(true)
  })

  it('unlocks row-1 via prestige on prerequisite', () => {
    const nodes = applyPrerequisiteUnlocks([
      mockNode({ id: 'drawing_fundamentals', prerequisites: [], level: 0, prestige: 1 }),
      mockNode({
        id: 'drawing_perspective',
        prerequisites: ['drawing_fundamentals'],
        isUnlocked: false,
      }),
    ])
    expect(nodes.find((n) => n.id === 'drawing_perspective')?.isUnlocked).toBe(true)
  })
})

describe('effectiveNodeLevel', () => {
  it('returns level when prestige is 0', () => {
    expect(effectiveNodeLevel(mockNode({ level: 7, prestige: 0 }))).toBe(7)
  })

  it('adds NODE_MAX_LEVEL per prestige', () => {
    expect(effectiveNodeLevel(mockNode({ level: 3, prestige: 1 }))).toBe(3 + NODE_MAX_LEVEL)
    expect(effectiveNodeLevel(mockNode({ level: 0, prestige: 2 }))).toBe(2 * NODE_MAX_LEVEL)
  })
})
