import { describe, it, expect, beforeEach } from 'vitest'
import {
  getQuestLogDerivedStats,
  resetQuestLogDerivedStatsCacheForTests,
} from '../questLogDerivedStatsCache'
import type { QuestCompletionLog } from '@/store/models'

const log = (id: number, at: string): QuestCompletionLog => ({
  questId: id,
  nodeId: '',
  completedAt: at,
  xpEarned: 10,
  difficulty: 'novice',
})

describe('getQuestLogDerivedStats cache', () => {
  beforeEach(() => {
    resetQuestLogDerivedStatsCacheForTests()
  })

  it('returns same object reference when logs fingerprint unchanged', () => {
    const logs = [log(1, '2026-06-01T12:00:00.000Z')]
    const a = getQuestLogDerivedStats(logs)
    const b = getQuestLogDerivedStats(logs)
    expect(a).toBe(b)
  })

  it('recomputes when a new log entry is appended', () => {
    const first = [log(1, '2026-06-01T12:00:00.000Z')]
    const stats1 = getQuestLogDerivedStats(first)
    const second = [...first, log(2, '2026-06-02T12:00:00.000Z')]
    const stats2 = getQuestLogDerivedStats(second)
    expect(stats2.uniquePracticeDays.length).toBeGreaterThan(stats1.uniquePracticeDays.length)
  })
})
