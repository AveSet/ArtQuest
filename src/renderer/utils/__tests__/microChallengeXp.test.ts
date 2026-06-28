import { describe, it, expect } from 'vitest'
import { computePhaseNodeXp, computePhaseNodeXpAmounts } from '@/utils/microChallengeXp'
import type { Quest } from '@/store/models'

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 1,
    code: 'test',
    title: { en: 'Test', ru: 'Test', zh: 'Test', ja: 'Test', ko: 'Test' },
    description: { en: 'Desc', ru: 'Desc', zh: 'Desc', ja: 'Desc', ko: 'Desc' },
    category: 'drawing',
    difficulty: 'novice',
    xp: 100,
    estimatedTime: 30,
    prerequisites: [],
    tags: [],
    source: 'test',
    icon: '',
    color: '',
    min_level: 1,
    medium: 'digital',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
    microChallenges: [
      { id: 'mc-warmup', instruction: { en: 'W', ru: 'W', zh: 'W', ja: 'W', ko: 'W' }, estimatedTime: 5, xp: 5 },
      { id: 'mc-core', instruction: { en: 'C', ru: 'C', zh: 'C', ja: 'C', ko: 'C' }, estimatedTime: 10, xp: 10 },
      { id: 'mc-polish', instruction: { en: 'P', ru: 'P', zh: 'P', ja: 'P', ko: 'P' }, estimatedTime: 15, xp: 15 },
    ],
    ...overrides,
  }
}

describe('microChallengeXp', () => {
  it('awards scaled node XP capped at 30% of quest face XP', () => {
    const quest = makeQuest({ xp: 100 })
    const amounts = computePhaseNodeXpAmounts(quest)
    const total = [...amounts.values()].reduce((s, v) => s + v, 0)
    expect(total).toBeLessThanOrEqual(30)
    expect(amounts.get('mc-warmup')).toBeGreaterThan(0)
  })

  it('returns zero when quest has no micro-challenges', () => {
    const quest = makeQuest({ microChallenges: [] })
    expect(computePhaseNodeXp(quest, 'mc-warmup')).toBe(0)
  })

  it('weights core and polish phases higher than warmup', () => {
    const quest = makeQuest({ xp: 100 })
    const amounts = computePhaseNodeXpAmounts(quest)
    const warmup = amounts.get('mc-warmup') ?? 0
    const core = amounts.get('mc-core') ?? 0
    const polish = amounts.get('mc-polish') ?? 0
    expect(core).toBeGreaterThan(warmup)
    expect(polish).toBeGreaterThan(warmup)
    expect(polish).toBeGreaterThanOrEqual(core)
  })
})
