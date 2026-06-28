import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pushAchievements, shiftNextAchievement } from '../achievementQueue'
import { useQuestStore } from '../useQuestStore'
import { useSkillStore, createInitialSkillNodes, getDefaultSkills } from '../useSkillStore'
import { useUIStore } from '../useUIStore'
import { type Quest, DEFAULT_SETTINGS } from '../models'
import { generateDailyQuests, buildDailyPrefsKey } from '@/utils/dailyQuestGenerator'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { checkAndGenerateDailyQuests } from '@/utils/dailyQuestCoordinator'

vi.mock('@/data/quests_data', () => ({
  default: [],
}))

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

beforeEach(() => {
  useQuestStore.setState({
    quests: [],
    questsLoaded: true,
    completedQuests: [],
    completedWorks: [],
    questCompletionLogs: [],
    dailyQuestsIds: [],
    completedToday: [],
    lastDailyQuestDate: '',
    lastFavCategories: '',
    lastCompletionReward: null,
  })
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    streakState: { current: 0, longest: 0, lastActiveDate: '' },
    settings: { ...DEFAULT_SETTINGS },
    isLoaded: true,
    achievementQueue: [],
  })
})

describe('useQuestStore', () => {
  describe('completeQuest', () => {
    it('blocks double completion of non-repeatable quests', () => {
      const quest = makeQuest(1, { is_repeatable: false })
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeQuest(1)
      const afterFirst = useQuestStore.getState().completedQuests
      expect(afterFirst).toContain(1)

      useQuestStore.getState().completeQuest(1)
      const afterSecond = useQuestStore.getState().completedQuests
      expect(afterSecond.length).toBe(1)
    })

    it('allows repeated completion of repeatable quests', () => {
      const quest = makeQuest(1, { is_repeatable: true })
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeQuest(1)
      expect(useQuestStore.getState().completedQuests).not.toContain(1)

      useQuestStore.getState().completeQuest(1)
      expect(useQuestStore.getState().questCompletionLogs.length).toBe(2)
    })

    it('adds completion log entry', () => {
      const quest = makeQuest(1)
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeQuest(1, 100, 'drawing')
      const logs = useQuestStore.getState().questCompletionLogs
      expect(logs.length).toBe(1)
      expect(logs[0].questId).toBe(1)
      expect(logs[0].xpEarned).toBeGreaterThan(0)
    })

    it('awards full legacy track XP on completion even with short logged practice', () => {
      useSkillStore.setState({
        skillNodes: createInitialSkillNodes().map((n) =>
          n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true } : n,
        ),
        legacySkills: getDefaultSkills().map((s) => ({ ...s, xp: 0, level: 1 })),
      })
      const quest = makeQuest(42, { xp: 69, category: 'drawing', tags: ['fundamentals'], estimatedTime: 30 })
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeQuest(42, 69, 'drawing', { practiceMinutes: 5 })

      const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
      expect(legacy?.xp).toBe(69)
    })

    it('awards capped node XP for micro-challenges but not legacy track', () => {
      useSkillStore.setState({
        skillNodes: createInitialSkillNodes().map((n) =>
          n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true } : n,
        ),
        legacySkills: getDefaultSkills().map((s) => ({ ...s, xp: 0, level: 1 })),
      })
      const quest = makeQuest(1, {
        xp: 100,
        microChallenges: [
          { id: 'mc-a', instruction: { en: 'A', ru: 'A', zh: 'A', ja: 'A', ko: 'A' }, estimatedTime: 5, xp: 25 },
        ],
      })
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeMicroChallenge(1, 'mc-a')
      useQuestStore.getState().awardPhaseSpeedBonus(1, 'mc-a')

      const legacy = useSkillStore.getState().legacySkills.find((s) => s.category === 'drawing')
      const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
      expect(legacy?.xp).toBe(0)
      expect(node?.xp).toBeGreaterThan(0)
      expect(node?.xp).toBeLessThanOrEqual(30)
    })

    it('skips phase XP when skipXp is set (session restore)', () => {
      useSkillStore.setState({
        skillNodes: createInitialSkillNodes().map((n) =>
          n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true } : n,
        ),
        legacySkills: getDefaultSkills().map((s) => ({ ...s, xp: 0, level: 1 })),
      })
      const quest = makeQuest(1, {
        xp: 100,
        microChallenges: [
          { id: 'mc-a', instruction: { en: 'A', ru: 'A', zh: 'A', ja: 'A', ko: 'A' }, estimatedTime: 5, xp: 25 },
        ],
      })
      useQuestStore.setState({ quests: [quest] })

      useQuestStore.getState().completeMicroChallenge(1, 'mc-a', { skipXp: true })

      const node = useSkillStore.getState().skillNodes.find((n) => n.id === 'drawing_fundamentals')
      expect(node?.xp).toBe(0)
    })
  })

  describe('uploadWork', () => {
    it('adds work to completedWorks', () => {
      useQuestStore.getState().uploadWork(1, 'data:image/png;base64,abc', '/path/to/file')
      const works = useQuestStore.getState().completedWorks
      expect(works.length).toBe(1)
      expect(works[0].questId).toBe(1)
      expect(works[0].savedPath).toBe('/path/to/file')
    })
  })

  describe('daily quests', () => {
    it('getDailyQuests returns only quests matching dailyQuestsIds', () => {
      const quests = [makeQuest(1), makeQuest(2), makeQuest(3)]
      useQuestStore.setState({ quests, dailyQuestsIds: [1, 3] })
      const daily = useQuestStore.getState().getDailyQuests()
      expect(daily).toHaveLength(2)
      expect(daily.map(q => q.id)).toEqual([1, 3])
    })

    it('regenerates stale dailies when saved prefs key does not match', () => {
      const today = getLocalDateStr()
      const quests = [
        makeQuest(1, { category: 'drawing', min_level: 1 }),
        makeQuest(2, { category: 'animation', min_level: 1 }),
        makeQuest(3, { category: 'effects', min_level: 1 }),
        makeQuest(4, { category: 'anatomy', min_level: 1 }),
      ]
      useUIStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          favoriteCategories: ['drawing', 'animation', 'effects'],
          useRandomCategories: false,
          learningProfile: 'animation',
        },
      })
      useQuestStore.setState({
        quests,
        dailyQuestsIds: [4],
        lastDailyQuestDate: today,
        lastFavCategories: '["drawing","animation","anatomy"]',
        completedToday: [],
      })

      checkAndGenerateDailyQuests()

      const state = useQuestStore.getState()
      const cats = state.dailyQuestsIds.map((id) => quests.find((q) => q.id === id)!.category)
      expect(cats).not.toContain('anatomy')
      expect(state.lastFavCategories).toBe(
        buildDailyPrefsKey({
          favoriteCategories: ['drawing', 'animation', 'effects'],
          useRandomCategories: false,
          learningProfile: 'animation',
        }),
      )
    })

    it('preserves completedToday for overlapping dailies when prefs change on the same day', () => {
      const today = getLocalDateStr()
      const quests = [
        makeQuest(1, { category: 'drawing', min_level: 1 }),
        makeQuest(2, { category: 'animation', min_level: 1 }),
        makeQuest(3, { category: 'effects', min_level: 1 }),
      ]
      useUIStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          favoriteCategories: ['drawing', 'animation', 'effects'],
          useRandomCategories: false,
          learningProfile: 'animation',
        },
      })
      useQuestStore.setState({
        quests,
        dailyQuestsIds: [1, 2, 3],
        completedToday: [1, 2],
        lastDailyQuestDate: today,
        lastFavCategories: buildDailyPrefsKey({
          favoriteCategories: ['drawing', 'animation', 'anatomy'],
          useRandomCategories: false,
          learningProfile: 'drawing',
        }),
      })

      checkAndGenerateDailyQuests()

      const state = useQuestStore.getState()
      expect(state.completedToday.every((id) => state.dailyQuestsIds.includes(id))).toBe(true)
      expect(state.completedToday.length).toBeGreaterThan(0)
      expect(state.dailyQuestsIds.length).toBe(3)
    })
  })

  describe('achievementQueue bridge', () => {
    it('queues achievements', () => {
      pushAchievements([
        { id: 'test', title: { en: 'Test', ru: 'Тест', zh: 'Test', ja: 'Test', ko: 'Test' }, description: { en: '', ru: '', zh: '', ja: '', ko: '' }, icon: '🏆' },
      ])
      expect(useUIStore.getState().achievementQueue).toHaveLength(1)
    })

    it('shiftNextAchievement removes first item', () => {
      pushAchievements([
        { id: 'a', title: { en: 'A', ru: 'А', zh: 'A', ja: 'A', ko: 'A' }, description: { en: '', ru: '', zh: '', ja: '', ko: '' }, icon: '🏆' },
        { id: 'b', title: { en: 'B', ru: 'Б', zh: 'B', ja: 'B', ko: 'B' }, description: { en: '', ru: '', zh: '', ja: '', ko: '' }, icon: '🏆' },
      ])
      shiftNextAchievement()
      expect(useUIStore.getState().achievementQueue).toHaveLength(1)
      expect(useUIStore.getState().achievementQueue[0].id).toBe('b')
    })
  })
})

describe('generateDailyQuests', () => {
  const quests = Array.from({ length: 10 }, (_, i) =>
    makeQuest(i + 1, { min_level: 0 })
  )
  const baseParams = { allQuests: quests, count: 3, avgLevel: 1, completedQuests: [] as number[] }

  it('returns deterministic results for same input', () => {
    const result1 = generateDailyQuests({ ...baseParams, dateStr: '2026-05-14' })
    const result2 = generateDailyQuests({ ...baseParams, dateStr: '2026-05-14' })
    expect(result1).toEqual(result2)
  })

  it('returns different results for different dates', () => {
    const result1 = generateDailyQuests({ ...baseParams, dateStr: '2026-05-14' })
    const result2 = generateDailyQuests({ ...baseParams, dateStr: '2026-05-15' })
    expect(result1).not.toEqual(result2)
  })

  it('excludes locked prerequisite quests from the daily pool', () => {
    const questsWithPrereqs = [
      ...quests,
      makeQuest(99, { prerequisites: [1] }),
      makeQuest(100, { prerequisites: [2] }),
    ]
    const result = generateDailyQuests({
      ...baseParams,
      allQuests: questsWithPrereqs,
      count: questsWithPrereqs.length,
      dateStr: '2026-05-14',
    })
    expect(result.some(id => id === 99 || id === 100)).toBe(false)
  })

  it('allows prerequisite quests when requirements are satisfied in logs', () => {
    const pair = [
      makeQuest(1, { category: 'drawing', min_level: 0 }),
      makeQuest(99, { category: 'drawing', min_level: 0, prerequisites: [1] }),
    ]
    const result = generateDailyQuests({
      allQuests: pair,
      count: 2,
      avgLevel: 1,
      completedQuests: [],
      favoriteCategories: ['drawing'],
      useRandomCategories: false,
      learningProfile: 'animation',
      dateStr: '2026-05-14',
      questCompletionLogs: [{ questId: 1, nodeId: 'drawing_fundamentals', completedAt: '2026-05-14T12:00:00.000Z', xpEarned: 10, difficulty: 'novice' }],
    })
    expect(result).toHaveLength(2)
    expect(result).toContain(1)
    expect(result).toContain(99)
  })

  it('returns the requested number of quests', () => {
    const result = generateDailyQuests({ ...baseParams, dateStr: '2026-05-14' })
    expect(result).toHaveLength(3)
  })

  it('all returned quests exist in the pool', () => {
    const poolIds = new Set(quests.map(q => q.id))
    const result = generateDailyQuests({ ...baseParams, dateStr: '2026-05-14' })
    result.forEach(id => expect(poolIds.has(id)).toBe(true))
  })

  it('uses favorite categories when provided', () => {
    const questsByCat = [
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 1, { category: 'drawing' })),
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 10, { category: 'animation' })),
      ...Array.from({ length: 5 }, (_, i) => makeQuest(i + 20, { category: 'effects' })),
    ]
    const result = generateDailyQuests({ allQuests: questsByCat, count: 3, avgLevel: 1, completedQuests: [], favoriteCategories: ['drawing', 'animation'], dateStr: '2026-05-14' })
    const cats = result.map(id => questsByCat.find(q => q.id === id)!.category)
    expect(cats).toContain('drawing')
    expect(cats).toContain('animation')
  })
})
