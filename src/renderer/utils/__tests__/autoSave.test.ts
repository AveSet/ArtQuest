import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { initAutoSave, resetAutoSaveForTests, setBatchLoading } from '../autoSave'
import { markChunkDirty, saveDirtyChunks } from '../incrementalSave'

vi.mock('../incrementalSave', () => ({
  markChunkDirty: vi.fn(),
  saveDirtyChunks: vi.fn().mockResolvedValue(true),
}))

const uiStoreState = {
  saveProgress: vi.fn().mockResolvedValue(undefined),
  saveProgressSync: vi.fn(),
  settings: {
    soundEnabled: true,
    soundVolume: 0.3,
    language: 'en' as const,
    favoriteCategories: ['drawing'] as const,
    useRandomCategories: false,
    minimizeToTray: false,
    openAtLogin: false,
    remindersEnabled: false,
    reminderHour: 18,
    reminderMinute: 0,
    fontScale: 'medium' as const,
    contrastBoost: false,
    reduceMotion: false,
    hasSeenOnboarding: true,
    materialFavoriteIds: [] as string[],
    materialCustomLinks: [] as unknown[],
  },
  streakState: { current: 0, longest: 0, lastActiveDate: '' },
  adaptiveWeights: { default: 1 },
  lastRefreshDate: '',
  questReviewSchedule: {},
  feedbackStats: {},
  activeGoal: null,
  completedGoals: [] as unknown[],
}

function createQuestStoreState() {
  return {
    completedQuests: [] as number[],
    questCompletionLogs: [] as unknown[],
    completedWorks: [] as unknown[],
    userQuests: [] as unknown[],
    deletedQuestIds: [] as number[],
    questTitleOverrides: {} as Record<string, string>,
    microChallengesCompleted: [] as unknown[],
    questSavedReferences: {} as Record<string, unknown>,
    dailyQuestsIds: [] as number[],
    completedToday: [] as number[],
    lastDailyQuestDate: '',
    lastFavCategories: [] as string[],
    dailyBonusGrantedDate: '',
    weeklyChallengeWeek: '',
    weeklyChallengeQuestId: null as string | null,
    weeklyChallengeCompletedWeek: '',
    lastWarmupCompletedDate: '',
    fundamentalsProgress: { completedIds: [] as string[], lastCompletedDate: '' },
  }
}

let questStoreState = createQuestStoreState()
let questStoreListener: ((state: typeof questStoreState) => void) | null = null

vi.mock('@/store/useUIStore', () => ({
  useUIStore: {
    getState: () => uiStoreState,
    subscribe: vi.fn(() => () => {}),
  },
}))

vi.mock('@/store/useQuestStore', () => ({
  useQuestStore: {
    getState: () => questStoreState,
    subscribe: (listener: (state: typeof questStoreState) => void) => {
      questStoreListener = listener
      return () => {
        questStoreListener = null
      }
    },
  },
}))

vi.mock('@/store/useSkillStore', () => ({
  useSkillStore: {
    getState: () => ({ skillNodes: [], legacySkills: [], achievements: [] }),
    subscribe: vi.fn(() => () => {}),
  },
}))

vi.mock('@/store/useSkillPracticeStore', () => ({
  useSkillPracticeStore: { subscribe: vi.fn(() => () => {}) },
}))

vi.mock('@/store/usePortraitStore', () => ({
  usePortraitStore: {
    getState: () => ({
      dailyChestStreak: 0,
      lastDailyChestProgressDate: '',
      streakShieldUsedMonth: '',
      lastShieldUsedOnDate: '',
    }),
    subscribe: vi.fn(() => () => {}),
  },
}))

describe('autoSave session subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAutoSaveForTests()
    setBatchLoading(false)
    questStoreState = createQuestStoreState()
    questStoreListener = null
    useQuestSessionStore.setState({ session: null })
  })

  it('does not schedule save on session timer ticks alone', async () => {
    vi.useFakeTimers()
    initAutoSave()
    useQuestSessionStore.setState({
      session: {
        questId: 1,
        mainMinutes: 10,
        referenceMinutes: 0,
        remainingSec: 20,
        isRunning: true,
        isExpired: false,
        overtimeElapsedSec: 0,
        graceRemainingSec: 0,
        graceExpired: false,
        startedAtMs: Date.now(),
        phases: [],
        currentPhaseIndex: 0,
        phaseRemainingSec: 0,
        currentPhaseEnteredAtMs: Date.now(),
        phasesComplete: false,
        referenceAtEnd: false,
      },
    })
    await vi.advanceTimersByTimeAsync(3000)
    const callsAfterStart = vi.mocked(saveDirtyChunks).mock.calls.length

    useQuestSessionStore.getState().tick()
    useQuestSessionStore.getState().tick()
    await vi.advanceTimersByTimeAsync(3000)

    expect(vi.mocked(saveDirtyChunks).mock.calls.length).toBe(callsAfterStart)
    vi.useRealTimers()
  })
})

describe('autoSave quest chunk mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAutoSaveForTests()
    setBatchLoading(false)
    questStoreState = createQuestStoreState()
    questStoreListener = null
    useQuestSessionStore.setState({ session: null })
  })

  it('marks core, quests, and gallery dirty when quest store changes', () => {
    initAutoSave()
    expect(questStoreListener).not.toBeNull()

    questStoreState = {
      ...createQuestStoreState(),
      dailyQuestsIds: [42],
      lastDailyQuestDate: '2026-06-12',
    }
    questStoreListener!(questStoreState)

    expect(vi.mocked(markChunkDirty).mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['core', 'quests', 'gallery']),
    )
  })
})
