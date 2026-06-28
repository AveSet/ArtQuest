import { describe, expect, it } from 'vitest'
import {
  filterQuestTimeLogs,
  median,
  medianPracticeMinutesByQuest,
  rescaleMicroChallengeMinutes,
  shrinkEstimatedTime,
} from '@/utils/questTimeCalibration'

describe('questTimeCalibration', () => {
  it('filters anomalies and timeouts', () => {
    const filtered = filterQuestTimeLogs([
      { questId: 1, practiceMinutes: 0 },
      { questId: 1, practiceMinutes: 400 },
      { questId: 1, practiceMinutes: 20, status: 'timeout' },
      { questId: 1, practiceMinutes: 12, isSpeedRun: true },
      { questId: 1, practiceMinutes: 25 },
    ])
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.practiceMinutes).toBe(25)
  })

  it('computes median and ignores sparse samples', () => {
    expect(median([10, 20, 30])).toBe(20)
    expect(median([10, 11, 30, 31])).toBe(21)
    const map = medianPracticeMinutesByQuest([
      { questId: 1, practiceMinutes: 20 },
      { questId: 1, practiceMinutes: 22 },
      { questId: 1, practiceMinutes: 24 },
      { questId: 1, practiceMinutes: 26 },
      { questId: 1, practiceMinutes: 28 },
      { questId: 2, practiceMinutes: 40 },
    ])
    expect(map.get(1)).toEqual({ median: 24, count: 5 })
    expect(map.has(2)).toBe(false)
  })

  it('shrinks toward catalog time', () => {
    expect(shrinkEstimatedTime(30, 50)).toBe(45)
    expect(shrinkEstimatedTime(110, 80)).toBe(90)
  })

  it('rescales micro-challenges to new total', () => {
    const scaled = rescaleMicroChallengeMinutes(
      [
        { id: 'a', instruction: { en: 'A', ru: 'A', zh: 'A', ja: 'A', ko: 'A' }, estimatedTime: 10, xp: 10 },
        { id: 'b', instruction: { en: 'B', ru: 'B', zh: 'B', ja: 'B', ko: 'B' }, estimatedTime: 20, xp: 20 },
      ],
      30,
      45,
    )
    expect(scaled.reduce((s, mc) => s + mc.estimatedTime, 0)).toBe(45)
  })

  it('returns empty medians for empty logs', () => {
    expect(median([])).toBeNull()
    expect(medianPracticeMinutesByQuest([]).size).toBe(0)
  })
})
