import { describe, it, expect } from 'vitest'
import type { Quest } from '@/store/models'
import { estimateQuestMetrics, nextUserQuestId, USER_QUEST_ID_MIN } from '../questMetricsEstimator'
import { computeQuestNodeXp } from '../progressionBalance'
import { extractTitleWorkScale } from '../questTitleScale'

const catalog: Quest[] = [
  {
    id: 1,
    code: 'DRW-00001',
    title: { en: 'Quick gesture sketch', ru: 'Быстрый жестовый скетч', zh: 'Quick gesture sketch', ja: 'Quick gesture sketch', ko: 'Quick gesture sketch' },
    category: 'drawing',
    difficulty: 'novice',
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    xp: 50,
    estimatedTime: 25,
    source: 'test',
    icon: '🎨',
    color: '#6366f1',
    min_level: 1,
    tags: ['gesture', 'sketch', 'novice', 'drawing', 'digital'],
    prerequisites: [],
    medium: 'digital',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
  },
  {
    id: 2,
    code: 'DRW-00002',
    title: { en: 'Draw cubes in perspective', ru: 'Нарисовать кубы в перспективе', zh: 'Draw cubes in perspective', ja: 'Draw cubes in perspective', ko: 'Draw cubes in perspective' },
    category: 'drawing',
    difficulty: 'novice',
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    xp: 46,
    estimatedTime: 23,
    source: 'test',
    icon: '🎨',
    color: '#6366f1',
    min_level: 1,
    tags: ['cube', 'perspective', 'novice', 'drawing', 'digital'],
    prerequisites: [],
    medium: 'digital',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
  },
]

describe('extractTitleWorkScale', () => {
  it('scales up modestly for large drill quantities (capped)', () => {
    const few = extractTitleWorkScale('нарисовать 5 кубов')
    const many = extractTitleWorkScale('нарисовать 5000 кубов')
    expect(many.quantityMultiplier).toBeGreaterThan(few.quantityMultiplier)
    expect(many.quantityMultiplier).toBeLessThanOrEqual(2.2)
  })
})

describe('estimateQuestMetrics', () => {
  it('applies a modest quantity multiplier for drill titles', () => {
    const few = estimateQuestMetrics('нарисовать 5 кубов', catalog, 'drawing')
    const many = estimateQuestMetrics('нарисовать 50 кубов', catalog, 'drawing')
    expect(many.breakdown.quantityMultiplier).toBeGreaterThan(
      few.breakdown.quantityMultiplier,
    )
    expect(many.difficulty).toBe('novice')
  })

  it('detects skill node from title', () => {
    const m = estimateQuestMetrics('нарисовать 5 кубов в перспективе', catalog, 'drawing')
    expect(m.skillNodeId).toMatch(/drawing/)
  })

  it('matches similar catalog title for baseline', () => {
    const m = estimateQuestMetrics('Quick gesture sketch practice', catalog, 'drawing')
    expect(m.xp).toBeGreaterThanOrEqual(40)
    expect(m.referenceQuestId).toBe(1)
    expect(m.skillXpAtEstimate).toBeGreaterThan(0)
    expect(m.breakdown.catalogXp).not.toBeNull()
  })

  it('exposes reward breakdown and rounds to 5', () => {
    const m = estimateQuestMetrics('нарисовать 5 кубов', catalog, 'drawing')
    expect(m.xp % 5).toBe(0)
    expect(m.estimatedTime % 5).toBe(0)
    expect(m.breakdown.semanticXp).toBeGreaterThan(0)
    expect(m.skillXpAtEstimate).toBe(computeQuestNodeXp(m.xp, m.estimatedTime))
  })

  it('keeps minutes-per-xp near catalog ratio after blending', () => {
    const m = estimateQuestMetrics('Quick gesture sketch practice', catalog, 'drawing')
    const ratio = m.estimatedTime / m.xp
    expect(ratio).toBeGreaterThan(0.35)
    expect(ratio).toBeLessThan(0.65)
  })

  it('falls back to semantic estimate without cross-category neighbors', () => {
    const effectsOnly: Quest[] = [
      {
        ...catalog[0]!,
        id: 99,
        category: 'effects',
        title: { en: 'Particle explosion study', ru: 'Изучение взрыва частиц', zh: 'Particle explosion study', ja: 'Particle explosion study', ko: 'Particle explosion study' },
        xp: 400,
        estimatedTime: 150,
        difficulty: 'master',
      },
    ]
    const m = estimateQuestMetrics('уникальный абстрактный эксперимент xyz', effectsOnly, 'drawing')
    expect(m.confidence).toBe('semantic')
    expect(m.xp).toBeLessThan(200)
    expect(m.breakdown.catalogNeighborCount).toBe(0)
  })

  it('rates simple warm-up lower than dance animation', () => {
    const simple = estimateQuestMetrics('быстрая разминка линий', catalog, 'drawing')
    const hard = estimateQuestMetrics(
      'анимировать танец двух людей',
      [
        {
          ...catalog[0]!,
          id: 10,
          title: { en: 'Two person dance cycle', ru: 'Танец двух людей: цикл', zh: 'Two person dance cycle', ja: 'Two person dance cycle', ko: 'Two person dance cycle' },
          category: 'animation',
          difficulty: 'advanced',
          xp: 180,
          estimatedTime: 70,
          tags: ['animation', 'dance', 'cycle'],
        },
      ],
      'animation',
    )
    expect(simple.xp).toBeLessThan(hard.xp)
    expect(simple.difficulty).not.toBe('master')
  })

  it('keeps cube perspective drills at novice level even with large counts', () => {
    const m = estimateQuestMetrics('Нарисовать 50 кубов в перспективе', catalog, 'drawing')
    expect(m.difficulty).toBe('novice')
    expect(m.xp).toBeLessThanOrEqual(80)
    expect(m.estimatedTime).toBeLessThanOrEqual(45)
  })
})

describe('nextUserQuestId', () => {
  it('starts at USER_QUEST_ID_MIN', () => {
    expect(nextUserQuestId([])).toBe(USER_QUEST_ID_MIN)
  })
})
