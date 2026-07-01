import { describe, it, expect } from 'vitest'
import {
  computeFlowMetrics,
  decayAdaptiveWeights,
  updateAdaptiveWeights,
  getDifficultyMultipliers,
  getRecommendedDifficultyShift,
} from '../adaptiveDifficulty'
import type { Quest, QuestCompletionLog, AdaptiveWeights } from '@/store/models'

const baseQuest = (id: number, difficulty: Quest['difficulty'], time: number): Quest => ({
  id,
  code: `T-${id}`,
  title: { en: 'Test', ru: 'Test', zh: 'Test', ja: 'Test', ko: 'Test' },
  category: 'drawing',
  difficulty,
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 50,
  estimatedTime: time,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 1,
})

describe('adaptiveDifficulty', () => {
  it('returns default flow metrics for empty logs', () => {
    const m = computeFlowMetrics([], [])
    expect(m.completionRate).toBe(1)
    expect(m.recentTrend).toBe('stable')
    expect(m.observationCount).toBe(0)
  })

  it('uses actual sample size for completionRate on small samples', () => {
    const quests = [baseQuest(1, 'novice', 30)]
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: new Date().toISOString(),
        xpEarned: 50,
        difficulty: 'novice',
        practiceMinutes: 15,
      },
    ]
    const m = computeFlowMetrics(logs, quests)
    expect(m.observationCount).toBe(1)
    expect(m.completionRate).toBe(1)
    expect(getRecommendedDifficultyShift(m)).toBe(0)
  })

  it('computes average time ratio from logs', () => {
    const quests = [baseQuest(1, 'novice', 30)]
    const logs: QuestCompletionLog[] = [
      {
        questId: 1,
        nodeId: '',
        completedAt: new Date().toISOString(),
        xpEarned: 50,
        difficulty: 'novice',
        practiceMinutes: 15,
      },
    ]
    const m = computeFlowMetrics(logs, quests)
    expect(m.averageTimeRatio).toBeCloseTo(0.5)
  })

  it('computes difficulty multipliers when struggling', () => {
    const weights: AdaptiveWeights = { default: 1, perspective: 1, proportions: 1, lighting: 1, clean_lines: 1, timing: 1, composition: 1 }
    const metrics = {
      completionRate: 0.3,
      averageTimeRatio: 1.8,
      averageDifficultyRating: 4.5,
      recentTrend: 'declining' as const,
      observationCount: 8,
    }
    expect(getRecommendedDifficultyShift(metrics)).toBe(-1)
    const mult = getDifficultyMultipliers(weights, metrics)
    expect(mult.intermediate).toBeGreaterThanOrEqual(mult.master)
  })

  it('updates tag weights when shift is easier', () => {
    const weights: AdaptiveWeights = { default: 1, perspective: 1.2, proportions: 1, lighting: 1, clean_lines: 1, timing: 1, composition: 1 }
    const metrics = {
      completionRate: 0.3,
      averageTimeRatio: 1.2,
      averageDifficultyRating: 4,
      recentTrend: 'declining' as const,
      observationCount: 6,
    }
    const next = updateAdaptiveWeights(weights, metrics)
    expect(next.perspective).toBeLessThan(weights.perspective!)
  })

  it('decays boosted weights toward baseline', () => {
    const weights: AdaptiveWeights = { default: 1, proportion: 1.6, line: 1 }
    const next = decayAdaptiveWeights(weights, 0.98)
    expect(next.proportion).toBeLessThan(1.6)
    expect(next.proportion).toBeGreaterThanOrEqual(1)
    expect(next.line).toBe(1)
  })
})
