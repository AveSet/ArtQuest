import type { QuestCompletionLog } from '@/store/models'
import {
  buildQuestLogDerivedStats,
  type QuestLogDerivedStats,
} from '@/utils/questLogDerivedStats'

let cachedFingerprint = ''
let cachedStats: QuestLogDerivedStats | null = null

function fingerprint(logs: QuestCompletionLog[]): string {
  const last = logs[logs.length - 1]
  return `${logs.length}|${last?.completedAt ?? ''}|${last?.questId ?? ''}|${last?.xpEarned ?? ''}`
}

/** Cached single-pass stats for large completion logs (timeline / heatmap). */
export function getQuestLogDerivedStats(logs: QuestCompletionLog[]): QuestLogDerivedStats {
  const fp = fingerprint(logs)
  if (cachedStats && fp === cachedFingerprint) return cachedStats
  cachedStats = buildQuestLogDerivedStats(logs)
  cachedFingerprint = fp
  return cachedStats
}

/** @internal Vitest only */
export function resetQuestLogDerivedStatsCacheForTests(): void {
  cachedFingerprint = ''
  cachedStats = null
}
