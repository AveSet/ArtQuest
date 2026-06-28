import { describe, it, expect } from 'vitest'
import { buildRecommendedQuestPool, RECOMMENDED_CATALOG_CAP } from '../recommendedQuestPool'
import { EMPTY_FUNDAMENTALS_PROGRESS } from '@/utils/fundamentalsProgress'
import type { QuestCategory } from '@/data/skillTree'
import type { Quest } from '@/store/models'

function makeQuest(id: number, difficulty: Quest['difficulty'] = 'novice'): Quest {
  return {
    id,
    code: `TST-${id}`,
    title: { en: `Quest ${id}`, ru: `Q${id}`, zh: `Q${id}`, ja: `Q${id}`, ko: `Q${id}` },
    category: 'drawing',
    difficulty,
    description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
    xp: 10,
    estimatedTime: 15,
    source: 'Test',
    icon: '🎨',
    color: '#6366f1',
    min_level: 1,
    tags: [],
    prerequisites: [],
    medium: 'digital',
    is_repeatable: true,
    review_after_days: 0,
    streak_bonus: 1,
  }
}

const baseParams = {
  quests: [] as Quest[],
  completedQuests: [] as number[],
  satisfiedOnceIds: new Set<number>(),
  dailyQuestsIds: [] as number[],
  completedToday: [] as number[],
  skillNodes: [],
  experienceTier: 'intermediate' as const,
  fundamentalsProgress: EMPTY_FUNDAMENTALS_PROGRESS,
  visibleCategories: ['drawing'] as QuestCategory[],
  questCompletionLogs: [],
}

describe('buildRecommendedQuestPool', () => {
  it('caps pool size at RECOMMENDED_CATALOG_CAP', () => {
    const quests = Array.from({ length: 40 }, (_, i) => makeQuest(i + 1))
    const pool = buildRecommendedQuestPool({
      ...baseParams,
      filteredQuests: quests,
      quests,
    })
    expect(pool.length).toBeLessThanOrEqual(RECOMMENDED_CATALOG_CAP)
    expect(RECOMMENDED_CATALOG_CAP).toBe(24)
  })

  it('always includes daily quests and recommended pick when eligible', () => {
    const daily = makeQuest(100)
    const recCandidate = makeQuest(200, 'intermediate')
    const filler = Array.from({ length: 30 }, (_, i) => makeQuest(i + 1))
    const quests = [daily, recCandidate, ...filler]
    const pool = buildRecommendedQuestPool({
      ...baseParams,
      filteredQuests: quests,
      quests,
      dailyQuestsIds: [100],
    })
    expect(pool.some((q) => q.id === 100)).toBe(true)
    expect(pool.length).toBeGreaterThan(0)
  })

  it('respects custom cap', () => {
    const quests = Array.from({ length: 10 }, (_, i) => makeQuest(i + 1))
    const pool = buildRecommendedQuestPool({
      ...baseParams,
      filteredQuests: quests,
      quests,
      cap: 5,
    })
    expect(pool.length).toBeLessThanOrEqual(5)
  })
})
