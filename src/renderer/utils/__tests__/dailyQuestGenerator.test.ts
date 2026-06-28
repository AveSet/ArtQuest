import { describe, it, expect } from 'vitest'
import {
  generateDailyQuests,
  dailyQuestIdsMatchPrefs,
  dailyQuestCategoriesMatchFavorites,
  sortDailyQuestsByFavoriteOrder,
  buildDailyPrefsKey,
} from '../dailyQuestGenerator'
import type { Quest } from '@/store/models'

const makeQuest = (id: number, overrides: Partial<Quest> = {}): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: `Quest ${id}`, ru: `Квест ${id}`, zh: `Quest ${id}`, ja: `Quest ${id}`, ko: `Quest ${id}` },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  xp: 100,
  estimatedTime: 30,
  source: 'test',
  icon: '',
  color: '',
  min_level: 0,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1.0,
  ...overrides,
})

describe('generateDailyQuests', () => {
  const quests = Array.from({ length: 10 }, (_, i) =>
    makeQuest(i + 1, { min_level: 0 })
  )

  it('returns deterministic results for same input', () => {
    const result1 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })
    const result2 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })
    expect(result1).toEqual(result2)
  })

  it('returns different results for different dates', () => {
    const r1 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })
    const r2 = generateDailyQuests({ allQuests: quests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-15' })
    expect(r1).not.toEqual(r2)
  })

  it('returns requested count', () => {
    expect(generateDailyQuests({ allQuests: quests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })).toHaveLength(3)
    expect(generateDailyQuests({ allQuests: quests, count: 5, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })).toHaveLength(5)
  })

  it('excludes completed non-repeatable quests', () => {
    const questsWithNonRepeatable = [
      makeQuest(1, { is_repeatable: false }),
      makeQuest(2, { is_repeatable: false }),
      makeQuest(3),
      makeQuest(4),
      makeQuest(5),
    ]
    const result = generateDailyQuests({ allQuests: questsWithNonRepeatable, count: 3, avgLevel: 1, completedQuests: [1, 2], dateStr: '2026-05-14' })
    expect(result).not.toContain(1)
    expect(result).not.toContain(2)
  })

  it('includes at most ceil(count/2) review quests when provided', () => {
    const questsPool = Array.from({ length: 10 }, (_, i) => makeQuest(i + 1))
    const result = generateDailyQuests({
      allQuests: questsPool, count: 3, avgLevel: 1, completedQuests: [],
      reviewQuestIds: [5],
      dateStr: '2026-05-14',
    })
    expect(result).toContain(5)
    const reviewCount = result.filter((id) => id === 5).length
    expect(reviewCount).toBe(1)
    expect(result.length).toBe(3)
  })

  it('allows spaced + skill review when two review ids provided', () => {
    const questsPool = Array.from({ length: 10 }, (_, i) => makeQuest(i + 1))
    const result = generateDailyQuests({
      allQuests: questsPool, count: 4, avgLevel: 1, completedQuests: [],
      reviewQuestIds: [5, 6],
      dateStr: '2026-05-14',
    })
    expect(result).toContain(5)
    expect(result).toContain(6)
    expect(result.length).toBe(4)
  })

  it('avoids repeating a quest in the same bucket until siblings are done', () => {
    const questsPool = [
      makeQuest(1, { category: 'drawing', difficulty: 'novice' }),
      makeQuest(2, { category: 'drawing', difficulty: 'novice' }),
      makeQuest(3, { category: 'drawing', difficulty: 'novice' }),
      makeQuest(4, { category: 'anatomy', difficulty: 'novice' }),
      makeQuest(5, { category: 'anatomy', difficulty: 'novice' }),
      makeQuest(6, { category: 'animation', difficulty: 'novice' }),
    ]
    const logs = [
      {
        questId: 1,
        nodeId: '',
        completedAt: '2026-05-13T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice' as const,
      },
    ]
    let sawRepeat = false
    for (let day = 14; day <= 24; day += 1) {
      const dateStr = `2026-05-${String(day).padStart(2, '0')}`
      const ids = generateDailyQuests({
        allQuests: questsPool,
        count: 3,
        avgLevel: 1,
        completedQuests: [],
        questCompletionLogs: logs,
        dateStr,
        favoriteCategories: ['drawing', 'anatomy', 'animation'],
      })
      if (ids.includes(1)) sawRepeat = true
    }
    expect(sawRepeat).toBe(false)
  })

  it('filters quests by player level without unfiltered fallback', () => {
    const leveledQuests = [
      makeQuest(1, { min_level: 1, difficulty: 'novice' }),
      makeQuest(2, { min_level: 1, difficulty: 'novice' }),
      makeQuest(3, { min_level: 1, difficulty: 'novice' }),
      makeQuest(4, { min_level: 1, difficulty: 'expert' }),
    ]
    const result = generateDailyQuests({ allQuests: leveledQuests, count: 3, avgLevel: 1, completedQuests: [], dateStr: '2026-05-14' })
    expect(result.every((id) => leveledQuests.find((q) => q.id === id)!.difficulty === 'novice')).toBe(true)
  })

  it('returns no dailies when every quest is completed and non-repeatable', () => {
    const questsDone = [
      makeQuest(1, { is_repeatable: false }),
      makeQuest(2, { is_repeatable: false }),
    ]
    const result = generateDailyQuests({
      allQuests: questsDone,
      count: 3,
      avgLevel: 1,
      completedQuests: [1, 2],
      dateStr: '2026-05-14',
    })
    expect(result).toEqual([])
  })

  it('fills as many slots as eligible quests allow when pool is smaller than count', () => {
    const smallPool = [makeQuest(1), makeQuest(2)]
    const result = generateDailyQuests({
      allQuests: smallPool,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      dateStr: '2026-05-14',
    })
    expect(result).toHaveLength(2)
    expect(result).toEqual(expect.arrayContaining([1, 2]))
  })

  it('uses favorite categories when provided', () => {
    const byCat = [
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 1, { category: 'drawing' })),
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 10, { category: 'animation' })),
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 20, { category: 'effects' })),
    ]
    const result = generateDailyQuests({ allQuests: byCat, count: 3, avgLevel: 1, completedQuests: [], favoriteCategories: ['drawing', 'animation'], dateStr: '2026-05-14' })
    const cats = result.map(id => byCat.find(q => q.id === id)!.category)
    expect(cats).toContain('drawing')
    expect(cats).toContain('animation')
  })

  it('picks one quest per category when three favorites are set', () => {
    const byCat = [
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 1, { category: 'drawing' })),
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 10, { category: 'animation' })),
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 20, { category: 'anatomy' })),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'anatomy', 'animation'],
      learningProfile: 'animation',
      dateStr: '2026-05-14',
    })
    const cats = result.map((id) => byCat.find((q) => q.id === id)!.category)
    expect(new Set(cats).size).toBe(3)
    expect(cats).toContain('drawing')
    expect(cats).toContain('anatomy')
    expect(cats).toContain('animation')
  })

  it('uses all three slots from the single favorite category', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing' }),
      makeQuest(2, { category: 'drawing' }),
      makeQuest(3, { category: 'drawing' }),
      makeQuest(4, { category: 'animation' }),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing'],
      learningProfile: 'animation',
      dateStr: '2026-05-14',
    })
    expect(result.every((id) => byCat.find((q) => q.id === id)!.category === 'drawing')).toBe(true)
  })

  it('allows a third daily outside two favorites when only two are selected', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing' }),
      makeQuest(2, { category: 'drawing' }),
      makeQuest(3, { category: 'anatomy' }),
      makeQuest(4, { category: 'anatomy' }),
      makeQuest(5, { category: 'animation' }),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'anatomy'],
      learningProfile: 'animation',
      dateStr: '2026-05-14',
    })
    const cats = result.map((id) => byCat.find((q) => q.id === id)!.category)
    expect(cats.filter((c) => c === 'drawing').length).toBeGreaterThanOrEqual(1)
    expect(cats.filter((c) => c === 'anatomy').length).toBeGreaterThanOrEqual(1)
  })

  it('includes animation at level 1 when category has no novice quests', () => {
    const byCat = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeQuest(i + 1, { category: 'drawing', difficulty: 'novice', min_level: 0 }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeQuest(i + 10, { category: 'anatomy', difficulty: 'novice', min_level: 0 }),
      ),
      makeQuest(20, { category: 'animation', difficulty: 'novice', min_level: 1 }),
      makeQuest(21, { category: 'animation', difficulty: 'novice', min_level: 1 }),
      makeQuest(22, { category: 'animation', difficulty: 'advanced', min_level: 5 }),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'anatomy', 'animation'],
      learningProfile: 'animation',
      dateStr: '2026-05-14',
    })
    const picked = result.map((id) => byCat.find((q) => q.id === id)!)
    const cats = picked.map((q) => q.category)
    expect(new Set(cats).size).toBe(3)
    expect(cats).toContain('drawing')
    expect(cats).toContain('anatomy')
    expect(cats).toContain('animation')
    const animationDaily = picked.find((q) => q.category === 'animation')
    expect(animationDaily?.difficulty).toBe('novice')
  })

  it('spreads dailies across three favorite categories when possible', () => {
    const byCat = [
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 1, { category: 'drawing' })),
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 10, { category: 'animation' })),
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 20, { category: 'effects' })),
      ...Array.from({ length: 4 }, (_, i) => makeQuest(i + 30, { category: 'anatomy' })),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'animation', 'effects'],
      dateStr: '2026-05-14',
    })
    const cats = new Set(result.map((id) => byCat.find((q) => q.id === id)!.category))
    expect(cats.size).toBe(3)
  })

  it('never picks anatomy when favorites exclude it', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'animation', min_level: 1 }),
      makeQuest(3, { category: 'effects', min_level: 1 }),
      makeQuest(4, { category: 'anatomy', min_level: 1 }),
      makeQuest(5, { category: 'anatomy', min_level: 1 }),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'animation', 'effects'],
      useRandomCategories: false,
      dateStr: '2026-05-15',
    })
    const cats = result.map((id) => byCat.find((q) => q.id === id)!.category)
    expect(cats).not.toContain('anatomy')
  })

  it('avoids duplicate categories in favorites when review slot already used one', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'drawing', min_level: 1 }),
      makeQuest(3, { category: 'animation', min_level: 1 }),
      makeQuest(4, { category: 'effects', min_level: 1 }),
      makeQuest(5, { category: 'anatomy', min_level: 1 }),
    ]
    const result = generateDailyQuests({
      allQuests: byCat,
      count: 3,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing', 'animation', 'effects'],
      reviewQuestIds: [1],
      dateStr: '2026-05-14',
    })
    const cats = result.map((id) => byCat.find((q) => q.id === id)!.category)
    expect(new Set(cats).size).toBe(3)
  })
})

describe('dailyQuestIdsMatchPrefs', () => {
  it('returns false when a daily quest is outside favorite categories', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'anatomy', min_level: 1 }),
    ]
    expect(
      dailyQuestIdsMatchPrefs([2], byCat, {
        favoriteCategories: ['drawing', 'animation', 'effects'],
        useRandomCategories: false,
        learningProfile: 'animation',
        dateStr: '2026-05-14',
      }),
    ).toBe(false)
  })

  it('returns false when three favorites produce duplicate categories in saved dailies', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'anatomy', min_level: 1 }),
      makeQuest(3, { category: 'anatomy', min_level: 1 }),
    ]
    expect(
      dailyQuestIdsMatchPrefs([1, 2, 3], byCat, {
        favoriteCategories: ['drawing', 'anatomy', 'animation'],
        useRandomCategories: false,
        learningProfile: 'animation',
        dateStr: '2026-05-14',
      }),
    ).toBe(false)
  })

  it('returns false when a favorite category is missing from saved dailies', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'drawing', min_level: 1 }),
      makeQuest(3, { category: 'anatomy', min_level: 1 }),
    ]
    expect(
      dailyQuestCategoriesMatchFavorites(
        [byCat[0]!, byCat[1]!, byCat[2]!],
        {
          favoriteCategories: ['drawing', 'anatomy', 'animation'],
          useRandomCategories: false,
          learningProfile: 'animation',
        },
      ),
    ).toBe(false)
  })

  it('returns false when two favorites but one is missing from saved dailies', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'drawing', min_level: 1 }),
      makeQuest(3, { category: 'effects', min_level: 1 }),
    ]
    expect(
      dailyQuestCategoriesMatchFavorites(
        [byCat[0]!, byCat[1]!, byCat[2]!],
        {
          favoriteCategories: ['drawing', 'anatomy'],
          useRandomCategories: false,
          learningProfile: 'animation',
        },
      ),
    ).toBe(false)
  })

  it('sorts daily quests by favorite category order', () => {
    const byCat = [
      makeQuest(1, { category: 'animation' }),
      makeQuest(2, { category: 'drawing' }),
      makeQuest(3, { category: 'anatomy' }),
    ]
    const sorted = sortDailyQuestsByFavoriteOrder(byCat, [1, 2, 3], {
      favoriteCategories: ['drawing', 'anatomy', 'animation'],
      useRandomCategories: false,
      learningProfile: 'animation',
    })
    expect(sorted.map((q) => q.category)).toEqual(['drawing', 'anatomy', 'animation'])
  })

  it('returns true when all daily quests match favorites', () => {
    const byCat = [
      makeQuest(1, { category: 'drawing', min_level: 1 }),
      makeQuest(2, { category: 'animation', min_level: 1 }),
      makeQuest(3, { category: 'effects', min_level: 1 }),
    ]
    expect(
      dailyQuestIdsMatchPrefs([1, 2, 3], byCat, {
        favoriteCategories: ['drawing', 'animation', 'effects'],
        useRandomCategories: false,
        learningProfile: 'animation',
        dateStr: '2026-05-14',
      }),
    ).toBe(true)
  })
})

describe('buildDailyPrefsKey', () => {
  it('includes favorites, random flag, and profile', () => {
    const key = buildDailyPrefsKey({
      favoriteCategories: ['drawing', 'effects'],
      useRandomCategories: false,
      learningProfile: 'drawing',
    })
    expect(JSON.parse(key)).toEqual({
      favorites: ['drawing', 'effects'],
      random: false,
      profile: 'drawing',
    })
  })
})
