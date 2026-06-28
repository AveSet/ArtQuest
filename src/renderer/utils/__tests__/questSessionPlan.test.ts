import { describe, expect, it } from 'vitest'
import {
  buildQuestSessionStart,
  buildSessionPhases,
  getQuestDisplayMinutes,
  getQuestSessionMainMinutes,
  orderMicroChallenges,
  sumMicroChallengeMinutes,
  QUEST_REFERENCE_BONUS_MINUTES,
} from '@/utils/questSessionPlan'
import type { Quest } from '@/store/models'

const questWithMc: Pick<Quest, 'id' | 'estimatedTime' | 'microChallenges'> = {
  id: 1,
  estimatedTime: 99,
  microChallenges: [
    { id: 'b', instruction: { en: 'B', ru: 'B', zh: 'B', ja: 'B', ko: 'B' }, estimatedTime: 10, xp: 10, prerequisite: 'a' },
    { id: 'a', instruction: { en: 'A', ru: 'A', zh: 'A', ja: 'A', ko: 'A' }, estimatedTime: 5, xp: 5 },
    { id: 'c', instruction: { en: 'C', ru: 'C', zh: 'C', ja: 'C', ko: 'C' }, estimatedTime: 15, xp: 15, prerequisite: 'b' },
  ],
}

describe('questSessionPlan', () => {
  it('orders micro challenges by prerequisite chain', () => {
    const ordered = orderMicroChallenges(questWithMc.microChallenges!)
    expect(ordered.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('sums micro challenge minutes for session timing', () => {
    expect(sumMicroChallengeMinutes(questWithMc)).toBe(30)
  })

  it('uses quest estimatedTime for pre-start display minutes', () => {
    expect(getQuestDisplayMinutes(questWithMc)).toBe(99)
    expect(getQuestDisplayMinutes(questWithMc, true)).toBe(99 + QUEST_REFERENCE_BONUS_MINUTES)
    expect(getQuestDisplayMinutes(questWithMc, false, 40)).toBe(40)
  })

  it('uses personalized minutes for session main timer', () => {
    expect(getQuestSessionMainMinutes(questWithMc, 40)).toBe(40)
    expect(getQuestSessionMainMinutes(questWithMc)).toBe(30)
  })

  it('builds reference phase first then exercise phases', () => {
    const phases = buildSessionPhases(questWithMc, true)
    expect(phases).toHaveLength(4)
    expect(phases[0]).toMatchObject({ kind: 'reference' })
    expect(phases[1]).toMatchObject({ kind: 'exercise', challengeId: 'a' })
    expect(phases[3]).toMatchObject({ kind: 'exercise', challengeId: 'c' })
  })

  it('session start uses exercise sum and reference at start flag', () => {
    const plan = buildQuestSessionStart(questWithMc, true)
    expect(plan.mainMinutes).toBe(30)
    expect(plan.referenceMinutes).toBe(QUEST_REFERENCE_BONUS_MINUTES)
    expect(plan.totalMinutes).toBe(30 + QUEST_REFERENCE_BONUS_MINUTES)
    expect(plan.referenceAtEnd).toBe(false)
  })
})
