import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuestStore } from '../useQuestStore'
import { useSkillStore } from '../useSkillStore'
import { useUIStore } from '../useUIStore'
import { DEFAULT_SETTINGS, type Quest, type SkillNode } from '../models'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { checkAndGenerateDailyQuests, initializeDailyQuests } from '@/utils/dailyQuestCoordinator'

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

function resetAllStores() {
  useUIStore.setState({
    isLoaded: true,
    settings: {
      ...DEFAULT_SETTINGS,
      soundEnabled: true,
      soundVolume: 0.3,
      language: 'en',
      favoriteCategories: ['drawing', 'animation', 'anatomy'],
      useRandomCategories: false,
    },
    streakState: { current: 0, longest: 0, lastActiveDate: '' },
    lastRefreshDate: '',
  })
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useQuestStore.setState({
    quests: [],
    catalogQuests: [],
    userQuests: [],
    deletedQuestIds: [],
    questTitleOverrides: {},
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
}

describe('quest full flow integration', () => {
  let capturedSaveData: string | null

  beforeEach(() => {
    resetAllStores()

    capturedSaveData = null

    // Mock electron API for save/load cycle
    vi.stubGlobal('window', {
      electronAPI: {
        progress: {
          save: vi.fn(async (data: string) => {
            capturedSaveData = data
          }),
          saveSync: vi.fn((data: string) => {
            capturedSaveData = data
          }),
          load: vi.fn(async () => {
            if (!capturedSaveData) return { status: 'empty' as const }
            return { status: 'ok' as const, data: JSON.parse(capturedSaveData) as Record<string, unknown> }
          }),
          clear: vi.fn(async () => ({ success: true })),
        },
        gallery: {
          readImage: vi.fn(async (_path: string) => null),
          listImages: vi.fn(async () => []),
        },
      },
    })
  })

  it('completes a quest, saves, loads, and restores all state', async () => {
    const quest = makeQuest(1, { is_repeatable: false, category: 'drawing', xp: 150, estimatedTime: 45 })
    useQuestStore.setState({ quests: [quest] })

    // Complete quest
    useQuestStore.getState().completeQuest(1, 150, 'drawing')

    // Verify completion state
    expect(useQuestStore.getState().completedQuests).toContain(1)
    expect(useQuestStore.getState().questCompletionLogs).toHaveLength(1)
    expect(useQuestStore.getState().questCompletionLogs[0].xpEarned).toBeGreaterThan(0)
    expect(useQuestStore.getState().lastCompletionReward).not.toBeNull()

    // Upload work
    useQuestStore.getState().uploadWork(1, 'data:image/png;base64,abc', '/artworks/test.png')

    expect(useQuestStore.getState().completedWorks).toHaveLength(1)
    expect(useQuestStore.getState().completedWorks[0].savedPath).toBe('/artworks/test.png')

    // Save
    await useUIStore.getState().saveProgress()
    expect(capturedSaveData).not.toBeNull()

    // Load into fresh stores
    resetAllStores()
    useQuestStore.setState({ quests: [quest] })

    await useUIStore.getState().loadProgress()

    // Verify restored state
    const questState = useQuestStore.getState()
    expect(questState.completedQuests).toEqual([1])
    expect(questState.questCompletionLogs).toHaveLength(1)
    expect(questState.questCompletionLogs[0].questId).toBe(1)
    expect(questState.completedWorks).toHaveLength(1)
    expect(questState.completedWorks[0].questId).toBe(1)
    expect(questState.completedWorks[0].savedPath).toBe('/artworks/test.png')
  })

  it('persists and restores daily quest state through save/load', async () => {
    const quests = [
      makeQuest(1, { category: 'drawing' }),
      makeQuest(2, { category: 'animation' }),
      makeQuest(3, { category: 'anatomy' }),
    ]
    useQuestStore.setState({ quests, questsLoaded: true })

    // Manually set daily quests (avoiding date-dependent generation)
    useQuestStore.setState({
      dailyQuestsIds: [1, 2],
      completedToday: [1],
      lastDailyQuestDate: '2026-05-15',
    })

    // Save and load
    await useUIStore.getState().saveProgress()
    resetAllStores()
    useQuestStore.setState({ quests, questsLoaded: true })
    await useUIStore.getState().loadProgress()

    const qs = useQuestStore.getState()
    expect(qs.dailyQuestsIds).toEqual([1, 2])
    // Progress from another calendar day must not count toward today
    expect(qs.completedToday).toEqual([])
    expect(qs.lastDailyQuestDate).toBe('2026-05-15')
  })

  it('preserves completedToday after full app init flow on same day (simulates restart)', async () => {
    const today = getLocalDateStr()
    const quests = [
      makeQuest(1, { category: 'drawing' }),
      makeQuest(2, { category: 'animation' }),
      makeQuest(3, { category: 'anatomy' }),
    ]
    useQuestStore.setState({ quests, questsLoaded: true })

    // Simulate user completed 1 of 3 daily quests and saved
    useQuestStore.setState({
      dailyQuestsIds: [1, 2, 3],
      completedToday: [1],
      lastDailyQuestDate: today,
      lastFavCategories: JSON.stringify({
        favorites: ['drawing', 'animation', 'anatomy'],
        random: false,
        profile: 'animation',
      }),
    })

    // Save progress (as happens after quest completion)
    await useUIStore.getState().saveProgress()

    // Simulate app restart: reset stores (except mock stays)
    resetAllStores()
    useQuestStore.setState({ quests, questsLoaded: true })

    // App.tsx init sequence: loadProgress → initializeDailyQuests → saveProgressSync
    await useUIStore.getState().loadProgress()

    // Now call initializeDailyQuests (which calls checkAndGenerateDailyQuests)
    initializeDailyQuests()

    // completedToday must be preserved since it's the same day
    const qs = useQuestStore.getState()
    expect(qs.completedToday).toEqual([1])
    expect(qs.lastDailyQuestDate).toBe(today)
    expect(qs.dailyQuestsIds).toEqual([1, 2, 3])
  })

  it('persists and restores streak state through save/load', async () => {
    useUIStore.setState({
      streakState: { current: 5, longest: 10, lastActiveDate: '2026-05-14' },
    })

    await useUIStore.getState().saveProgress()
    resetAllStores()
    await useUIStore.getState().loadProgress()

    const streak = useUIStore.getState().streakState
    expect(streak.current).toBe(5)
    expect(streak.longest).toBe(10)
    expect(streak.lastActiveDate).toBe('2026-05-14')
  })

  it('resets daily streak when multiple days were missed on day rollover', () => {
    useUIStore.setState({
      streakState: { current: 8, longest: 12, lastActiveDate: '2026-05-10' },
    })
    useQuestStore.setState({
      quests: [makeQuest(1), makeQuest(2), makeQuest(3)],
      questsLoaded: true,
      lastDailyQuestDate: '2026-05-10',
      dailyQuestsIds: [1, 2, 3],
    })

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-14T12:00:00'))
    checkAndGenerateDailyQuests('2026-05-14')
    vi.useRealTimers()

    expect(useUIStore.getState().streakState.current).toBe(0)
  })

  it('regenerates daily quest ids when the calendar date changes', () => {
    const quests = [makeQuest(1), makeQuest(2), makeQuest(3), makeQuest(4), makeQuest(5)]
    useQuestStore.setState({
      quests,
      questsLoaded: true,
      lastDailyQuestDate: '2026-05-13',
      dailyQuestsIds: [1, 2, 3],
    })

    checkAndGenerateDailyQuests('2026-05-14')
    const firstDayIds = [...useQuestStore.getState().dailyQuestsIds]

    checkAndGenerateDailyQuests('2026-05-15')
    const secondDayIds = useQuestStore.getState().dailyQuestsIds

    expect(firstDayIds.length).toBeGreaterThan(0)
    expect(secondDayIds.length).toBeGreaterThan(0)
    expect(useQuestStore.getState().lastDailyQuestDate).toBe('2026-05-15')
  })

  it('persists and restores skill nodes through save/load', async () => {
    const nodes: SkillNode[] = [
      {
        id: 'drawing_fundamentals',
        parentId: null,
        category: 'drawing',
        title: { en: 'Drawing Fundamentals', ru: 'Основы рисунка', zh: 'Drawing Fundamentals', ja: 'Drawing Fundamentals', ko: 'Drawing Fundamentals' },
        description: { en: 'Basic drawing', ru: 'Базовый рисунок', zh: 'Basic drawing', ja: 'Basic drawing', ko: 'Basic drawing' },
        level: 3,
        xp: 250,
        maxXp: 400,
        prerequisites: [],
        tags: [],
        reviewIntervalDays: 30,
        lastReviewDate: null,
        isUnlocked: true,
        order: 0,
        prestige: 0,
      },
    ]
    useSkillStore.setState({ skillNodes: nodes })

    await useUIStore.getState().saveProgress()
    resetAllStores()
    await useUIStore.getState().loadProgress()

    const loadedNodes = useSkillStore.getState().skillNodes
    // Saved node is merged with all fresh SKILL_TREE_NODES
    expect(loadedNodes.length).toBeGreaterThan(1)
    const drawing = loadedNodes.find(n => n.id === 'drawing_fundamentals')
    expect(drawing).toBeDefined()
    expect(drawing!.level).toBe(3)
  })

  it('handles save when electron API is unavailable', async () => {
    vi.stubGlobal('window', {})

    await expect(useUIStore.getState().saveProgress()).resolves.toBeUndefined()
  })

  it('handles load when electron API is unavailable', async () => {
    vi.stubGlobal('window', {})

    useQuestStore.setState({ questsLoaded: false })
    await useUIStore.getState().loadProgress()

    expect(useUIStore.getState().isLoaded).toBe(true)
  })
})
