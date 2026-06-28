import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Quest, QuestCompletionLog } from '@/store/models'
import {
  appendQuestCompletionLogPatch,
  awardMicroChallengePhaseXp,
  buildCatalogQuestCompletionPatch,
  buildLastCompletionReward,
  buildMicroChallengeCompletionPatch,
  buildQuestTimeoutLogEntry,
  finalizeQuestCompletion,
  playMicroChallengeCompleteSound,
} from '../questCompletionService'

vi.mock('@/utils/questCompletionPipeline', () => ({
  runQuestCompletionEffects: vi.fn(),
}))

vi.mock('@/utils/sound', () => ({
  playSound: vi.fn(),
}))

vi.mock('@/utils/questXpReward', () => ({
  distributePhaseNodeXp: vi.fn(),
}))

vi.mock('@/utils/microChallengeXp', () => ({
  computePhaseNodeXp: vi.fn(() => 4),
}))

vi.mock('@/store/xpFloatStore', () => ({
  useXpFloatStore: {
    getState: () => ({ push: vi.fn() }),
  },
}))

const quest: Quest = {
  id: 7,
  code: 'Q-7',
  title: { en: 'Test', ru: 'Test', zh: 'Test', ja: 'Test', ko: 'Test' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 20,
  estimatedTime: 15,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 1,
}

const logEntry: QuestCompletionLog = {
  questId: 7,
  nodeId: '',
  completedAt: '2026-06-13T12:00:00.000Z',
  xpEarned: 20,
  difficulty: 'novice',
}

describe('questCompletionService helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('buildLastCompletionReward returns null when no XP', () => {
    expect(buildLastCompletionReward(0, 0, 'drawing')).toBeNull()
    expect(buildLastCompletionReward(5, 0, 'drawing')).toEqual({
      questXp: 5,
      skillXp: 0,
      category: 'drawing',
    })
  })

  it('buildCatalogQuestCompletionPatch marks daily completion and non-repeatable quest', () => {
    const patch = buildCatalogQuestCompletionPatch(
      {
        completedQuests: [],
        completedToday: [],
        dailyQuestsIds: [7],
        lastDailyQuestDate: '2026-06-13',
        questCompletionLogs: [],
      },
      {
        quest,
        questId: 7,
        trackXp: 10,
        nodeXp: 5,
        rewardCategory: 'drawing',
        logEntry,
        today: '2026-06-13',
      },
    )
    expect(patch.completedQuests).toEqual([7])
    expect(patch.completedToday).toEqual([7])
    expect(patch.questCompletionLogs).toHaveLength(1)
    expect(patch.lastCompletionReward).toEqual({ questXp: 10, skillXp: 5, category: 'drawing' })
  })

  it('appendQuestCompletionLogPatch appends log and reward', () => {
    const patch = appendQuestCompletionLogPatch(
      { questCompletionLogs: [] },
      { trackXp: 3, nodeXp: 2, rewardCategory: 'drawing', logEntry },
    )
    expect(patch.questCompletionLogs).toEqual([logEntry])
    expect(patch.lastCompletionReward).toEqual({ questXp: 3, skillXp: 2, category: 'drawing' })
  })

  it('finalizeQuestCompletion triggers float, optional sound, and pipeline', async () => {
    const { runQuestCompletionEffects } = await import('@/utils/questCompletionPipeline')
    const { playSound } = await import('@/utils/sound')
    finalizeQuestCompletion({
      questId: 7,
      quest,
      logEntry,
      trackXp: 10,
      nodeXp: 5,
      rewardCategory: 'drawing',
      practiceMinutes: 12,
      isSpeedRun: false,
      playCompleteSound: true,
    })
    expect(runQuestCompletionEffects).toHaveBeenCalledOnce()
    expect(playSound).toHaveBeenCalledWith('complete', 'drawing')
  })

  it('buildMicroChallengeCompletionPatch dedupes and appends challenge id', () => {
    expect(
      buildMicroChallengeCompletionPatch({ microChallengesCompleted: {} }, 7, 'phase-1'),
    ).toEqual({ microChallengesCompleted: { '7': ['phase-1'] } })
    expect(
      buildMicroChallengeCompletionPatch(
        { microChallengesCompleted: { '7': ['phase-1'] } },
        7,
        'phase-1',
      ),
    ).toBeNull()
  })

  it('awardMicroChallengePhaseXp distributes phase XP and plays float', async () => {
    const { distributePhaseNodeXp } = await import('@/utils/questXpReward')
    const xpQuest: Quest = {
      ...quest,
      microChallenges: [
        {
          id: 'phase-1',
          instruction: { en: 'P', ru: 'P', zh: 'P', ja: 'P', ko: 'P' },
          estimatedTime: 5,
          xp: 4,
        },
      ],
    }
    const xp = awardMicroChallengePhaseXp(xpQuest, 'phase-1')
    expect(xp).toBe(4)
    expect(distributePhaseNodeXp).toHaveBeenCalledWith(4, 'drawing', { tags: [] })
  })

  it('buildQuestTimeoutLogEntry marks timeout status', () => {
    const entry = buildQuestTimeoutLogEntry(quest, 7, 12, 3, 2)
    expect(entry.status).toBe('timeout')
    expect(entry.xpEarned).toBe(5)
    expect(entry.practiceMinutes).toBe(12)
  })

  it('playMicroChallengeCompleteSound respects silent option', async () => {
    const { playSound } = await import('@/utils/sound')
    playMicroChallengeCompleteSound(quest, { silent: true })
    playMicroChallengeCompleteSound(quest)
    expect(playSound).toHaveBeenCalledOnce()
  })
})
