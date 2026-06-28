import { describe, it, expect } from 'vitest'
import {
  QUEST_DIFFICULTY_ORDER,
  QUEST_DIFFICULTY_RANK,
  compareQuestDifficulty,
} from '../difficultyOrder'

describe('difficultyOrder', () => {
  it('orders expert before master', () => {
    expect(QUEST_DIFFICULTY_ORDER.indexOf('expert')).toBeLessThan(
      QUEST_DIFFICULTY_ORDER.indexOf('master'),
    )
    expect(QUEST_DIFFICULTY_RANK.expert).toBeLessThan(QUEST_DIFFICULTY_RANK.master)
  })

  it('compareQuestDifficulty matches rank order', () => {
    expect(compareQuestDifficulty('novice', 'master')).toBeLessThan(0)
    expect(compareQuestDifficulty('expert', 'master')).toBeLessThan(0)
    expect(compareQuestDifficulty('master', 'expert')).toBeGreaterThan(0)
  })
})
