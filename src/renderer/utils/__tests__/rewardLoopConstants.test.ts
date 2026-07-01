import { describe, it, expect } from 'vitest'
import {
  REFERENCE_QUEST_REWARD_CASES,
  computeReferenceQuestRewards,
  DAILY_COMPLETION_BONUS_MULTIPLIER,
  WEEKLY_CHALLENGE_BONUS_MIN,
  WEEKLY_CHALLENGE_BONUS_MULTIPLIER,
} from '../rewardLoopConstants'

describe('rewardLoopConstants golden cases', () => {
  it('locks canonical reward outputs', () => {
    const byName = Object.fromEntries(
      REFERENCE_QUEST_REWARD_CASES.map((c) => [c.name, computeReferenceQuestRewards(c)]),
    )

    expect(byName['normal completion']).toEqual({
      trackXp: 40,
      nodeXp: 8,
      dailyBonusXp: 17,
      weeklyBonusXp: 80,
      practiceXp: 30,
    })
    expect(byName['overtime completion'].trackXp).toBe(30)
    expect(byName['overtime completion'].nodeXp).toBe(8)
    expect(byName['speed-run completion'].trackXp).toBe(40)
    expect(byName['all dailies complete bonus'].dailyBonusXp).toBe(Math.round(36 * DAILY_COMPLETION_BONUS_MULTIPLIER))
    expect(byName['weekly challenge bonus'].weeklyBonusXp).toBe(
      Math.max(WEEKLY_CHALLENGE_BONUS_MIN, Math.round(66 * WEEKLY_CHALLENGE_BONUS_MULTIPLIER)),
    )
    expect(byName['long practice session'].practiceXp).toBe(Math.round(45 * 1.5))
    expect(byName['long practice session'].trackXp).toBe(0)
  })

  it('keeps daily bonus softer than prior 50% burst', () => {
    expect(DAILY_COMPLETION_BONUS_MULTIPLIER).toBeLessThan(0.5)
  })

  it('keeps weekly bonus softer than prior 75% burst', () => {
    expect(WEEKLY_CHALLENGE_BONUS_MULTIPLIER).toBeLessThan(0.75)
    expect(WEEKLY_CHALLENGE_BONUS_MIN).toBeLessThan(100)
  })
})
