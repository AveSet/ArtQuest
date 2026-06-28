import { describe, it, expect } from 'vitest'
import {
  bucketKey,
  getDailyRotationWeight,
  isBucketSaturated,
} from '../dailyQuestRotation'
import type { Quest, QuestCompletionLog } from '@/store/models'

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

describe('dailyQuestRotation', () => {
  it('bucketKey combines category and difficulty', () => {
    expect(bucketKey(makeQuest(1))).toBe('drawing:novice')
  })

  it('zero weight for repeat in unsaturated bucket', () => {
    const quests = [makeQuest(1), makeQuest(2), makeQuest(3)]
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: '2026-05-01T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
      },
    ]
    expect(isBucketSaturated(logs, quests, bucketKey(quests[0]!))).toBe(false)
    expect(getDailyRotationWeight(quests[0]!, logs, quests)).toBe(0)
    expect(getDailyRotationWeight(quests[1]!, logs, quests)).toBe(1)
  })

  it('allows repeat after bucket saturated', () => {
    const quests = [makeQuest(1), makeQuest(2)]
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: '2026-05-01T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
      },
      {
        questId: 2,
        nodeId: '',
        completedAt: '2026-05-02T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
      },
    ]
    expect(isBucketSaturated(logs, quests, bucketKey(quests[0]!))).toBe(true)
    expect(getDailyRotationWeight(quests[0]!, logs, quests)).toBe(1)
  })

  it('timeout-only sibling does not saturate bucket or reset weights', () => {
    const quests = [makeQuest(1), makeQuest(2), makeQuest(3)]
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: '2026-05-01T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
      },
      {
        questId: 2,
        nodeId: '',
        completedAt: '2026-05-02T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
      },
      {
        questId: 3,
        nodeId: '',
        completedAt: '2026-05-03T12:00:00.000Z',
        xpEarned: 0,
        difficulty: 'novice',
        practiceMinutes: 15,
        status: 'timeout',
      },
    ]
    expect(isBucketSaturated(logs, quests, bucketKey(quests[0]!))).toBe(false)
    expect(getDailyRotationWeight(quests[0]!, logs, quests)).toBe(0)
    expect(getDailyRotationWeight(quests[2]!, logs, quests)).toBe(1)
  })
})
