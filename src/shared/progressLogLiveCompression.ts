import type { CompressedCompletionLogsV1, CompressibleQuestCompletionLog } from './progressLogCompression'
import {
  compressCompletionLogsForExport,
  expandCompressedCompletionLogs,
} from './progressLogCompression'

/** Persist compressed quests chunk when at or above this count (schema v26 JSON compression). */
export const COMPRESS_LIVE_MIN_LOGS = 200
/** Full log entries kept at the tail for UI/analytics. */
export const RECENT_TAIL_SIZE = 50

/** Schema v27 stores bulk history in SQLite; JSON keeps tail + summary only. */
export const SQLITE_LOGS_SCHEMA_VERSION = 27

export type StoredQuestCompletionLogsV26 = {
  compressedLogs?: CompressedCompletionLogsV1
  recentTail?: CompressibleQuestCompletionLog[]
  questCompletionLogs?: CompressibleQuestCompletionLog[]
}

export function shouldCompressCompletionLogsLive(logCount: number): boolean {
  return logCount >= COMPRESS_LIVE_MIN_LOGS
}

export function toCompressibleLog(log: Record<string, unknown>): CompressibleQuestCompletionLog {
  return {
    questId: log.questId as number,
    completedAt: String(log.completedAt ?? ''),
    xpEarned: typeof log.xpEarned === 'number' ? log.xpEarned : 0,
    difficulty: String(log.difficulty ?? 'novice'),
    nodeId: String(log.nodeId ?? ''),
    practiceMinutes: typeof log.practiceMinutes === 'number' ? log.practiceMinutes : undefined,
    notes: typeof log.notes === 'string' ? log.notes : undefined,
    status:
      log.status === 'timeout' || log.status === 'completed' ? log.status : undefined,
  }
}

export function packQuestCompletionLogsForStorage(
  logs: Record<string, unknown>[],
  schemaVersion = 26,
): Record<string, unknown> {
  if (schemaVersion >= SQLITE_LOGS_SCHEMA_VERSION) {
    if (logs.length < COMPRESS_LIVE_MIN_LOGS) {
      return { questCompletionLogs: logs }
    }
    return {
      recentTail: logs.slice(-RECENT_TAIL_SIZE),
      completionLogSummary: { totalCount: logs.length },
    }
  }
  if (!shouldCompressCompletionLogsLive(logs.length)) {
    return { questCompletionLogs: logs }
  }
  const recentTail = logs.slice(-RECENT_TAIL_SIZE)
  const head = logs.slice(0, -RECENT_TAIL_SIZE).map(toCompressibleLog)
  const compressedLogs = compressCompletionLogsForExport(head)
  return {
    compressedLogs,
    recentTail,
  }
}

function isCompressedCompletionLogsV1(value: unknown): value is CompressedCompletionLogsV1 {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as CompressedCompletionLogsV1).v === 1 &&
    Array.isArray((value as CompressedCompletionLogsV1).rows)
  )
}

/** Expand stored quests chunk fields into a plain completion log array for migration/parse. */
export function unpackQuestCompletionLogsFromStorage(raw: Record<string, unknown>): unknown[] {
  const compressed = raw.compressedLogs
  const recentTail = raw.recentTail
  if (isCompressedCompletionLogsV1(compressed)) {
    const expanded = expandCompressedCompletionLogs(compressed)
    const tail = Array.isArray(recentTail)
      ? recentTail.filter((entry) => typeof entry === 'object' && entry !== null)
      : []
    return [...expanded, ...tail]
  }
  if (Array.isArray(recentTail) && recentTail.length > 0) {
    return recentTail
  }
  if (Array.isArray(raw.questCompletionLogs)) {
    return raw.questCompletionLogs
  }
  return []
}

export function mergeExpandedLogsIntoQuestsChunk(
  chunk: Record<string, unknown>,
  expandedLogs: unknown[],
): Record<string, unknown> {
  const { compressedLogs: _c, recentTail: _t, questCompletionLogs: _q, ...rest } = chunk
  void _c
  void _t
  void _q
  return {
    ...rest,
    questCompletionLogs: expandedLogs,
  }
}
