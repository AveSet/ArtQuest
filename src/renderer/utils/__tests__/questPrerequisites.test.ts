import { describe, it, expect } from 'vitest'
import { getQuestUnlockState, getSatisfiedQuestIds, isQuestPermanentlyCompleted } from '../questPrerequisites'
import type { QuestCompletionLog } from '@/store/models'
import type { Quest } from '@/store/models'

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  const id = overrides.id ?? 1
  return {
    id,
    code: overrides.code ?? `Q-${id}`,
    title: { en: 'Test', ru: 'Тест', zh: 'Test', ja: 'Test', ko: 'Test' },
    description: { en: 'Desc', ru: 'Описание', zh: 'Desc', ja: 'Desc', ko: 'Desc' },
    category: 'drawing',
    difficulty: 'novice',
    xp: 100,
    estimatedTime: 30,
    min_level: 1,
    medium: 'digital',
    source: 'test',
    icon: '🎨',
    color: '',
    tags: [],
    prerequisites: [],
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
    ...overrides,
  }
}

describe('isQuestPermanentlyCompleted', () => {
  it('returns true for completed non-repeatable quests', () => {
    const q = makeQuest({ id: 5, is_repeatable: false })
    expect(isQuestPermanentlyCompleted(q, [5])).toBe(true)
  })

  it('returns false for repeatable quests even when id is in completedQuests (legacy saves)', () => {
    const q = makeQuest({ id: 5, is_repeatable: true })
    expect(isQuestPermanentlyCompleted(q, [5])).toBe(false)
  })
})

describe('getQuestUnlockState', () => {
  it('locks quest when prerequisites missing', () => {
    const q = makeQuest({ id: 2, prerequisites: [1] })
    expect(getQuestUnlockState(q, []).unlocked).toBe(false)
  })

  it('unlocks when repeatable prerequisite is only in completion logs', () => {
    const prereq = makeQuest({ id: 1, is_repeatable: true })
    const q = makeQuest({ id: 2, prerequisites: [1] })
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: '2026-05-01T12:00:00.000Z',
        xpEarned: 100,
        difficulty: 'novice',
        practiceMinutes: 30,
      },
    ]
    const satisfied = getSatisfiedQuestIds(logs)
    expect(getQuestUnlockState(q, [], satisfied).unlocked).toBe(true)
    expect(getQuestUnlockState(prereq, [], satisfied).unlocked).toBe(true)
  })
})
