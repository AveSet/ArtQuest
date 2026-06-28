import { describe, expect, it } from 'vitest'
import type { Quest } from '@/store/models'
import animationCatalog from '@/data/quests_animation.json'
import {
  getDailyQuestPool,
  isQuestUnlockedForPlayerLevel,
  maxDifficultyRankForAvgLevel,
} from '@/utils/questLevelGate'

const baseQuest = (overrides: Partial<Quest>): Quest =>
  ({
    id: 1,
    code: 'q1',
    title: { en: 'Test', ru: 'Test', zh: 'Test', ja: 'Test', ko: 'Test' },
    category: 'drawing',
    difficulty: 'novice',
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    xp: 10,
    estimatedTime: 30,
    source: 'test',
    icon: '🎨',
    color: '#000',
    min_level: 1,
    tags: [],
    prerequisites: [],
    medium: 'both',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 0,
    ...overrides,
  }) as Quest

describe('questLevelGate', () => {
  it('caps difficulty rank for low average level', () => {
    expect(maxDifficultyRankForAvgLevel(2)).toBe(1)
    expect(maxDifficultyRankForAvgLevel(5)).toBe(2)
    expect(maxDifficultyRankForAvgLevel(8)).toBe(3)
    expect(maxDifficultyRankForAvgLevel(25)).toBe(5)
  })

  it('blocks advanced quests for beginners even when min_level is low', () => {
    const advanced = baseQuest({ difficulty: 'advanced', min_level: 1 })
    expect(isQuestUnlockedForPlayerLevel(advanced, 2)).toBe(false)
    expect(isQuestUnlockedForPlayerLevel(baseQuest({ difficulty: 'novice' }), 2)).toBe(true)
  })

  it('getDailyQuestPool never returns advanced quests for level 1 beginners', () => {
    const pool = getDailyQuestPool(
      [
        baseQuest({ id: 1, difficulty: 'novice', category: 'drawing' }),
        baseQuest({ id: 2, difficulty: 'advanced', min_level: 5, category: 'animation' }),
        baseQuest({ id: 3, difficulty: 'intermediate', min_level: 5, category: 'animation' }),
      ],
      1,
    )
    expect(pool.every((q) => q.difficulty !== 'advanced')).toBe(true)
  })

  it('getDailyQuestPool uses the easiest tier when category has no novice quests', () => {
    const pool = getDailyQuestPool(
      [
        baseQuest({ id: 2, difficulty: 'advanced', min_level: 5, category: 'animation' }),
        baseQuest({ id: 3, difficulty: 'intermediate', min_level: 5, category: 'animation' }),
        baseQuest({ id: 4, difficulty: 'intermediate', min_level: 6, category: 'animation' }),
      ],
      1,
    )
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((q) => q.difficulty === 'intermediate')).toBe(true)
    expect(pool.every((q) => q.min_level === 5)).toBe(true)
  })

  it('getDailyQuestPool picks novice animation when available at level 1', () => {
    const pool = getDailyQuestPool(
      [
        baseQuest({ id: 10, difficulty: 'novice', min_level: 0, category: 'animation' }),
        baseQuest({ id: 11, difficulty: 'advanced', min_level: 5, category: 'animation' }),
      ],
      1,
    )
    expect(pool).toHaveLength(1)
    expect(pool[0]!.difficulty).toBe('novice')
  })

  it('uses real animation catalog starter tier for level 1 dailies', () => {
    const animation = animationCatalog as Quest[]
    const pool = getDailyQuestPool(animation, 1)
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((q) => q.difficulty === 'novice')).toBe(true)
    expect(pool.every((q) => q.min_level <= 3)).toBe(true)
  })
})
