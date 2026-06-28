import type { QuestCompletionLog } from '@/store/models'

export type FeedbackStatsEntry = {
  count: number
  avgDifficulty: number
  weakCriteria: string[]
}

export function aggregateFeedbackStats(logs: QuestCompletionLog[]): Record<string, FeedbackStatsEntry> {
  const byCategory: Record<string, { difficulties: number[]; criteriaScores: Record<string, number[]> }> = {}

  for (const log of logs) {
    const cat = log.category ?? 'general'
    if (!byCategory[cat]) {
      byCategory[cat] = { difficulties: [], criteriaScores: {} }
    }
    const bucket = byCategory[cat]!
    if (log.feedback?.difficultyRating) {
      bucket.difficulties.push(log.feedback.difficultyRating)
    }
    for (const c of log.feedback?.criteria ?? []) {
      if (!bucket.criteriaScores[c.label]) bucket.criteriaScores[c.label] = []
      bucket.criteriaScores[c.label]!.push(c.rating)
    }
    for (const tag of log.feedback?.mistakeTags ?? []) {
      if (!bucket.criteriaScores[tag]) bucket.criteriaScores[tag] = []
      bucket.criteriaScores[tag]!.push(1)
    }
  }

  const result: Record<string, FeedbackStatsEntry> = {}
  for (const [cat, data] of Object.entries(byCategory)) {
    const avgDifficulty =
      data.difficulties.length > 0
        ? data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length
        : 3
    const weakCriteria = Object.keys(data.criteriaScores).filter((key) => {
      const scores = data.criteriaScores[key]
      if (!scores || scores.length === 0) return false
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return avg <= 2.5
    }).map(String)
    result[cat] = { count: data.difficulties.length, avgDifficulty, weakCriteria }
  }
  return result
}

export function getWeakestCriterionThisWeek(
  logs: QuestCompletionLog[],
): { criterion: string; avgScore: number } | null {
  const weekAgo = Date.now() - 7 * 86_400_000
  const recent = logs.filter((l) => new Date(l.completedAt).getTime() >= weekAgo)
  const scores: Record<string, number[]> = {}
  for (const log of recent) {
    for (const c of log.feedback?.criteria ?? []) {
      if (!scores[c.label]) scores[c.label] = []
      scores[c.label]!.push(c.rating)
    }
    for (const tag of log.feedback?.mistakeTags ?? []) {
      if (!scores[tag]) scores[tag] = []
      scores[tag]!.push(1)
    }
  }
  let worst: { criterion: string; avgScore: number } | null = null
  for (const [criterion, vals] of Object.entries(scores)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    if (!worst || avg < worst.avgScore) worst = { criterion, avgScore: avg }
  }
  return worst
}
