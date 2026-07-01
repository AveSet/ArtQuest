import type { Quest, QuestCompletionLog, FlowMetrics, AdaptiveWeights } from '@/store/models'
import { QUEST_DIFFICULTY_ORDER, QUEST_DIFFICULTY_RANK } from '../../shared/difficultyOrder'

const WINDOW_SIZE = 20
const MIN_ADAPTIVE_SAMPLE = 5

function isSuccessfulCompletion(log: QuestCompletionLog): boolean {
  return (log as QuestCompletionLog & { status?: string }).status !== 'timeout'
}

/** Compute flow metrics from the last N completion logs */
export function computeFlowMetrics(
  logs: QuestCompletionLog[],
  quests: Quest[],
): FlowMetrics {
  const recent = logs.slice(-WINDOW_SIZE)
  if (recent.length === 0) {
    return {
      completionRate: 1,
      averageTimeRatio: 1,
      averageDifficultyRating: 3,
      recentTrend: 'stable',
      observationCount: 0,
    }
  }

  const questMap = new Map(quests.map((q) => [q.id, q]))

  let totalTimeRatio = 0
  let timeRatioCount = 0
  let totalDifficultyRating = 0
  let difficultyRatingCount = 0

  for (const log of recent) {
    const q = questMap.get(log.questId)
    if (q && q.estimatedTime > 0 && log.practiceMinutes && log.practiceMinutes > 0) {
      totalTimeRatio += log.practiceMinutes / q.estimatedTime
      timeRatioCount++
    }
    if (log.feedback?.difficultyRating) {
      totalDifficultyRating += log.feedback.difficultyRating
      difficultyRatingCount++
    }
  }

  const avgTimeRatio = timeRatioCount > 0 ? totalTimeRatio / timeRatioCount : 1
  const avgDifficultyRating = difficultyRatingCount > 0
    ? totalDifficultyRating / difficultyRatingCount
    : 3

  const earlier = logs.slice(-WINDOW_SIZE * 2, -WINDOW_SIZE)
  const earlierRate = earlier.length > 0
    ? earlier.filter((l) => l.feedback?.difficultyRating && l.feedback.difficultyRating <= 3).length / earlier.length
    : 0.5
  const recentRate = recent.length > 0
    ? recent.filter((l) => l.feedback?.difficultyRating && l.feedback.difficultyRating <= 3).length / recent.length
    : 0.5

  let recentTrend: FlowMetrics['recentTrend'] = 'stable'
  if (earlier.length >= 3 && recent.length >= 3) {
    if (recentRate < earlierRate - 0.1) recentTrend = 'declining'
    else if (recentRate > earlierRate + 0.1) recentTrend = 'improving'
  }

  const successfulRecent = recent.filter(isSuccessfulCompletion).length
  const completionRate =
    recent.length > 0 ? Math.min(1, successfulRecent / recent.length) : 1

  return {
    completionRate,
    averageTimeRatio: Math.round(avgTimeRatio * 100) / 100,
    averageDifficultyRating: Math.round(avgDifficultyRating * 10) / 10,
    recentTrend,
    observationCount: recent.length,
  }
}

/** Suggest whether to go easier, harder, or stay based on flow metrics */
export function getRecommendedDifficultyShift(metrics: FlowMetrics): -1 | 0 | 1 {
  if (metrics.observationCount < MIN_ADAPTIVE_SAMPLE) return 0
  if (metrics.completionRate < 0.4) return -1
  if (metrics.averageTimeRatio > 1.5 && metrics.completionRate >= 0.6) return -1
  if (metrics.averageTimeRatio < 0.7 && metrics.completionRate >= 0.8 && metrics.averageDifficultyRating <= 3) return 1
  return 0
}

/** Map a difficulty to a -2..+2 delta relative to the user's current average difficulty */
export function difficultyDelta(difficulty: Quest['difficulty']): number {
  return QUEST_DIFFICULTY_RANK[difficulty] - 2
}

/** Given current adaptive weights, compute difficulty multipliers for each level */
export function getDifficultyMultipliers(
  weights: AdaptiveWeights,
  metrics: FlowMetrics,
): Record<Quest['difficulty'], number> {
  const shift = getRecommendedDifficultyShift(metrics)
  const confidence = Math.max(0.5, Math.min(1.5, weights.default ?? 1))
  const base = QUEST_DIFFICULTY_ORDER.map((d, i) => {
    let mult = 1
    const rank = i - 2
    if (shift === -1 && rank > 0) mult = Math.max(0.3, 1 - rank * 0.3)
    if (shift === 1 && rank < 0) mult = Math.max(0.3, 1 + rank * 0.3)
    if (shift === 0 && Math.abs(rank) >= 2) mult = 0.6
    return [d, Math.max(0.1, mult * confidence)] as const
  })
  return Object.fromEntries(base) as Record<Quest['difficulty'], number>
}

/** Update adaptive weights based on recent completion patterns */
export function updateAdaptiveWeights(
  currentWeights: AdaptiveWeights,
  metrics: FlowMetrics,
): AdaptiveWeights {
  const shift = getRecommendedDifficultyShift(metrics)
  const weights = { ...currentWeights }
  const tags = Object.keys(weights).filter((k) => k !== 'default')

  for (const tag of tags) {
    let adjustment = 0
    if (shift === -1 && weights[tag] > 0.5) adjustment = -0.05
    if (shift === 1 && weights[tag] < 1.5) adjustment = 0.05
    if (adjustment !== 0) {
      weights[tag] = Math.round((weights[tag] + adjustment) * 100) / 100
    }
  }

  return weights
}

/** Gently decay boosted tag weights toward baseline on day rollover. */
export function decayAdaptiveWeights(
  weights: AdaptiveWeights,
  factor = 0.98,
): AdaptiveWeights {
  const result = { ...weights }
  for (const key of Object.keys(result)) {
    if (key === 'default') continue
    const value = result[key]
    if (value > 1) {
      result[key] = Math.max(1, Math.round((1 + (value - 1) * factor) * 100) / 100)
    }
  }
  return result
}

/** Estimate user's average difficulty rank from completion logs */
export function estimateAverageDifficulty(logs: QuestCompletionLog[]): number {
  if (logs.length === 0) return 2
  let total = 0
  let count = 0
  for (const log of logs.slice(-50)) {
    const rank = QUEST_DIFFICULTY_RANK[log.difficulty]
    if (rank !== undefined) {
      total += rank
      count++
    }
  }
  return count > 0 ? total / count : 2
}
