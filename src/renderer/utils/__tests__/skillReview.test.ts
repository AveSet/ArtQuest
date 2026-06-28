import { describe, it, expect } from 'vitest'
import { getNodesDueForReview, getReviewableQuestIds } from '@/utils/skillReview'
import type { SkillNode } from '@/store/models'

const makeNode = (
  id: string,
  overrides: Partial<SkillNode> = {}
): SkillNode => ({
  id,
  parentId: null,
  category: 'drawing',
  title: { en: 'Test', ru: 'Тест', zh: 'Test', ja: 'Test', ko: 'Test' },
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  level: 1,
  xp: 0,
  maxXp: 100,
  prerequisites: [],
  tags: ['test'],
  reviewIntervalDays: 0,
  lastReviewDate: null,
  isUnlocked: true,
  order: 0,
  prestige: 0,
  ...overrides,
})

describe('getNodesDueForReview', () => {
  it('returns empty for nodes with reviewIntervalDays = 0', () => {
    const nodes = [makeNode('a', { reviewIntervalDays: 0, lastReviewDate: '2026-01-01' })]
    expect(getNodesDueForReview(nodes, '2026-05-15')).toHaveLength(0)
  })

  it('returns empty for nodes with null lastReviewDate', () => {
    const nodes = [makeNode('a', { reviewIntervalDays: 7, lastReviewDate: null })]
    expect(getNodesDueForReview(nodes, '2026-05-15')).toHaveLength(0)
  })

  it('returns node when overdue', () => {
    const nodes = [makeNode('a', { reviewIntervalDays: 7, lastReviewDate: '2026-05-01' })]
    const result = getNodesDueForReview(nodes, '2026-05-15')
    expect(result).toHaveLength(1)
    expect(result[0].nodeId).toBe('a')
    expect(result[0].daysOverdue).toBe(7) // 14 days elapsed - 7 interval = 7 overdue
  })

  it('does not return node when not yet due', () => {
    const nodes = [makeNode('a', { reviewIntervalDays: 14, lastReviewDate: '2026-05-10' })]
    const result = getNodesDueForReview(nodes, '2026-05-15')
    expect(result).toHaveLength(0)
  })

  it('returns multiple overdue nodes sorted by daysOverdue desc', () => {
    const nodes = [
      makeNode('a', { reviewIntervalDays: 3, lastReviewDate: '2026-05-01', category: 'drawing' }),
      makeNode('b', { reviewIntervalDays: 7, lastReviewDate: '2026-05-01', category: 'animation' }),
      makeNode('c', { reviewIntervalDays: 7, lastReviewDate: '2026-04-20', category: 'effects' }),
    ]
    const result = getNodesDueForReview(nodes, '2026-05-15')
    expect(result).toHaveLength(3)
    expect(result[0].nodeId).toBe('c')
    expect(result[1].nodeId).toBe('a')
    expect(result[2].nodeId).toBe('b')
  })
})

describe('getReviewableQuestIds', () => {
  const quests = [
    { id: 1, category: 'drawing', tags: ['perspective', 'depth'] },
    { id: 2, category: 'drawing', tags: ['shapes', 'volume'] },
    { id: 3, category: 'animation', tags: ['timing', 'rhythm'] },
    { id: 4, category: 'animation', tags: ['spacing', 'ease'] },
    { id: 5, category: 'drawing', tags: ['lines'] },
  ]

  it('matches quests by category and tags', () => {
    const nodes = [
      { nodeId: 'perspective_node', category: 'drawing', tags: ['perspective', 'depth'], daysOverdue: 5 },
    ]
    const result = getReviewableQuestIds(nodes, quests)
    expect(result).toContain(1)
    expect(result).not.toContain(2)
    expect(result).not.toContain(3)
  })

  it('falls back to first category quest when no tag match', () => {
    const nodes = [
      { nodeId: 'weird_node', category: 'drawing', tags: ['nonexistent'], daysOverdue: 3 },
    ]
    const result = getReviewableQuestIds(nodes, quests)
    expect(result).toContain(1)
    expect(result.length).toBe(1)
  })

  it('returns empty when no quests match category', () => {
    const nodes = [
      { nodeId: 'story_node', category: 'storytelling', tags: ['story'], daysOverdue: 3 },
    ]
    const result = getReviewableQuestIds(nodes, quests)
    expect(result).toHaveLength(0)
  })

  it('deduplicates quest IDs across multiple nodes', () => {
    const nodes = [
      { nodeId: 'a', category: 'drawing', tags: ['perspective'], daysOverdue: 3 },
      { nodeId: 'b', category: 'drawing', tags: ['perspective'], daysOverdue: 1 },
    ]
    const result = getReviewableQuestIds(nodes, quests)
    expect(new Set(result).size).toBe(result.length)
  })
})
