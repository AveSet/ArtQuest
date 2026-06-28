import type { MicroChallenge } from '@/store/models'

export const QUEST_TIME_MIN_SAMPLES = 5
export const QUEST_TIME_MIN_MINUTES = 1
export const QUEST_TIME_MAX_MINUTES = 300
export const QUEST_TIME_SHRINKAGE = 0.7

export type QuestTimeLogRow = {
  questId: number
  practiceMinutes?: number
  status?: 'completed' | 'timeout'
  isSpeedRun?: boolean
}

export function filterQuestTimeLogs(logs: QuestTimeLogRow[]): QuestTimeLogRow[] {
  return logs.filter((log) => {
    if (log.status === 'timeout') return false
    const minutes = log.practiceMinutes
    if (minutes == null || minutes < QUEST_TIME_MIN_MINUTES || minutes > QUEST_TIME_MAX_MINUTES) {
      return false
    }
    if (log.isSpeedRun) return false
    return true
  })
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
  }
  return sorted[mid]!
}

export function medianPracticeMinutesByQuest(
  logs: QuestTimeLogRow[],
): Map<number, { median: number; count: number }> {
  const filtered = filterQuestTimeLogs(logs)
  const byQuest = new Map<number, number[]>()
  for (const log of filtered) {
    const minutes = log.practiceMinutes!
    const bucket = byQuest.get(log.questId) ?? []
    bucket.push(minutes)
    byQuest.set(log.questId, bucket)
  }
  const result = new Map<number, { median: number; count: number }>()
  for (const [questId, values] of byQuest) {
    if (values.length < QUEST_TIME_MIN_SAMPLES) continue
    const med = median(values)
    if (med != null) result.set(questId, { median: med, count: values.length })
  }
  return result
}

export function roundQuestMinutes(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5)
}

export function shrinkEstimatedTime(catalogMinutes: number, observedMedian: number): number {
  const blended =
    QUEST_TIME_SHRINKAGE * observedMedian + (1 - QUEST_TIME_SHRINKAGE) * catalogMinutes
  return roundQuestMinutes(blended)
}

export function rescaleMicroChallengeMinutes(
  microChallenges: MicroChallenge[],
  oldTotal: number,
  newTotal: number,
): MicroChallenge[] {
  if (microChallenges.length === 0 || oldTotal <= 0 || newTotal <= 0) return microChallenges
  const scale = newTotal / oldTotal
  const scaled = microChallenges.map((mc) => ({
    ...mc,
    estimatedTime: Math.max(1, Math.round(mc.estimatedTime * scale)),
  }))
  const sum = scaled.reduce((s, mc) => s + mc.estimatedTime, 0)
  if (sum === newTotal) return scaled
  const delta = newTotal - sum
  const last = scaled[scaled.length - 1]
  if (last) {
    scaled[scaled.length - 1] = {
      ...last,
      estimatedTime: Math.max(1, last.estimatedTime + delta),
    }
  }
  return scaled
}

export function clampEstimatedTimeToBand(
  minutes: number,
  bandMin: number,
  bandMax: number,
): number {
  return roundQuestMinutes(Math.min(bandMax, Math.max(bandMin, minutes)))
}
