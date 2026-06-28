import { describe, it, expect } from 'vitest'
import { buildQuestLogDerivedStats, countUniqueQuestsPerCategory } from '../questLogDerivedStats'
import type { Quest } from '@/store/models'

describe('questLogDerivedStats', () => {
  it('aggregates daily counts in one pass', () => {
    const stats = buildQuestLogDerivedStats([
      { questId: 1, completedAt: '2026-05-20T10:00:00.000Z' },
      { questId: 1, completedAt: '2026-05-20T18:00:00.000Z' },
      { questId: 2, completedAt: '2026-05-21T10:00:00.000Z' },
    ] as never[])
    expect(stats.uniquePracticeDays).toHaveLength(2)
    expect(stats.dailyCounts.get('2026-05-20')).toBe(2)
    expect(stats.maxDailyCount).toBe(2)
  })

  it('counts unique quest ids per category', () => {
    const lookup = new Map<number, Quest>([
      [1, { id: 1, category: 'drawing' } as Quest],
      [2, { id: 2, category: 'drawing' } as Quest],
    ])
    const counts = countUniqueQuestsPerCategory(
      [
        { questId: 1, completedAt: '2026-05-01' },
        { questId: 1, completedAt: '2026-05-02' },
        { questId: 2, completedAt: '2026-05-03' },
      ] as never[],
      lookup,
    )
    expect(counts.drawing).toBe(2)
  })
})
