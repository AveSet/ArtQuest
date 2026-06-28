import { describe, it, expect } from 'vitest'
import { evaluateHiddenAchievementUnlocks } from '../hiddenAchievementChecks'

describe('evaluateHiddenAchievementUnlocks', () => {
  it('unlocks streak-based hidden achievement when streak threshold met', () => {
    const unlocked = evaluateHiddenAchievementUnlocks({
      quests: [],
      questCompletionLogs: [],
      streakCurrent: 100,
      unlockedAchievementIds: new Set(),
    })
    expect(unlocked.some((a) => a.id === 'century')).toBe(true)
  })

  it('skips already unlocked hidden achievements', () => {
    const unlocked = evaluateHiddenAchievementUnlocks({
      quests: [],
      questCompletionLogs: [],
      streakCurrent: 100,
      unlockedAchievementIds: new Set(['century']),
    })
    expect(unlocked).toHaveLength(0)
  })
})
