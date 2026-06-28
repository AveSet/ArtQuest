import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Quest, QuestCompletionLog } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'
import { DEFAULT_ADAPTIVE_WEIGHTS } from '@/store/models'
import { runQuestCompletionEffects } from '../questCompletionPipeline'
import { getIsoWeekKey } from '../weeklyChallenge'

vi.mock('@/utils/feedbackOrchestrator', () => ({
  dispatchFeedbackMoment: vi.fn(),
}))

vi.mock('@/utils/questXpReward', () => ({
  distributeQuestXp: vi.fn(),
}))

vi.mock('@/store/usePortraitStore', () => ({
  usePortraitStore: {
    getState: () => ({
      tryConsumeShieldForMissedDay: () => false,
      recordAllDailiesComplete: vi.fn(),
    }),
  },
}))

const makeQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: 42,
  code: 'Q-42',
  title: { en: 'Test', ru: 'Test', zh: 'Test', ja: 'Test', ko: 'Test' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 40,
  estimatedTime: 20,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: ['line'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
  ...overrides,
})

const makeLog = (questId: number): QuestCompletionLog => ({
  questId,
  nodeId: 'node-1',
  completedAt: new Date().toISOString(),
  xpEarned: 40,
  difficulty: 'novice',
})

describe('runQuestCompletionEffects', () => {
  beforeEach(() => {
    useQuestStore.setState({
      quests: [makeQuest()],
      questCompletionLogs: [makeLog(42)],
      completedQuests: [42],
      dailyQuestsIds: [],
      completedToday: [],
      dailyBonusGrantedDate: '',
      weeklyChallengeQuestId: 0,
      weeklyChallengeCompletedWeek: '',
    })
    useUIStore.setState({
      questReviewSchedule: {},
      feedbackStats: {},
      adaptiveWeights: structuredClone(DEFAULT_ADAPTIVE_WEIGHTS),
      streakState: { current: 0, longest: 0, lastActiveDate: '', streakRecoveryDueDate: undefined },
    })
    useSkillStore.setState({
      checkAchievements: vi.fn(() => []),
      checkHiddenAchievements: vi.fn(),
      markSkillNodesReviewed: vi.fn(),
    } as Partial<ReturnType<typeof useSkillStore.getState>>)
  })

  it('schedules spaced review when quest has review_after_days', () => {
    const quest = makeQuest({ id: 7, review_after_days: 5 })
    const logEntry = makeLog(7)
    useQuestStore.setState({ quests: [quest], questCompletionLogs: [logEntry] })

    runQuestCompletionEffects({
      questId: 7,
      quest,
      logEntry,
      trackXp: 40,
      nodeXp: 10,
      rewardCategory: 'drawing',
      practiceMinutes: 15,
      isSpeedRun: false,
    })

    expect(useUIStore.getState().questReviewSchedule['7']).toBeDefined()
    expect(useUIStore.getState().questReviewSchedule['7']!.intervalDays).toBeGreaterThanOrEqual(5)
  })

  it('boosts adaptive weights from feedback mistake tags', () => {
    const quest = makeQuest()
    const logEntry: QuestCompletionLog = {
      ...makeLog(42),
      category: 'drawing',
      feedback: {
        difficultyRating: 3,
        criteria: [],
        mistakeTags: ['proportion'],
        notes: '',
      },
    }
    useQuestStore.setState({ questCompletionLogs: [logEntry] })

    runQuestCompletionEffects({
      questId: 42,
      quest,
      logEntry,
      trackXp: 40,
      nodeXp: 10,
      rewardCategory: 'drawing',
      practiceMinutes: 15,
      isSpeedRun: false,
      feedback: logEntry.feedback,
    })

    const weights = useUIStore.getState().adaptiveWeights
    expect(weights.proportion).toBeGreaterThan(DEFAULT_ADAPTIVE_WEIGHTS.proportion ?? 1)
    expect(useUIStore.getState().feedbackStats.drawing?.count).toBe(1)
  })

  it('marks weekly challenge complete and stores bonus xp', () => {
    const quest = makeQuest({ id: 99 })
    const logEntry = makeLog(99)
    const weekKey = getIsoWeekKey()
    useQuestStore.setState({
      quests: [quest],
      questCompletionLogs: [logEntry],
      weeklyChallengeQuestId: 99,
      weeklyChallengeCompletedWeek: '',
    })

    runQuestCompletionEffects({
      questId: 99,
      quest,
      logEntry,
      trackXp: 40,
      nodeXp: 10,
      rewardCategory: 'drawing',
      practiceMinutes: 15,
      isSpeedRun: false,
    })

    expect(useQuestStore.getState().weeklyChallengeCompletedWeek).toBe(weekKey)
    expect(useQuestStore.getState().lastCompletionReward?.bonusWeeklyXp).toBeGreaterThan(0)
  })
})
