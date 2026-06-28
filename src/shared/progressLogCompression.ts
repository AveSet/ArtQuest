export type CompressibleQuestCompletionLog = {
  questId: number
  completedAt: string
  xpEarned: number
  difficulty: string
  nodeId: string
  practiceMinutes?: number
  notes?: string
}

/** Compact export format for large completion histories (import expands back to full logs). */
export type CompressedCompletionLogsV1 = {
  v: 1
  /** [questId, completedAt, xpEarned, difficulty, nodeId, practiceMinutes?, notes?] */
  rows: Array<
    [
      number,
      string,
      number,
      string,
      string,
      number?,
      string?,
    ]
  >
}

export const COMPRESS_EXPORT_MIN_LOGS = 80

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function shouldCompressCompletionLogsForExport(
  logs: CompressibleQuestCompletionLog[],
): boolean {
  return logs.length >= COMPRESS_EXPORT_MIN_LOGS
}

export function compressCompletionLogsForExport(
  logs: CompressibleQuestCompletionLog[],
): CompressedCompletionLogsV1 {
  return {
    v: 1,
    rows: logs.map((log) => [
      log.questId,
      log.completedAt,
      log.xpEarned,
      log.difficulty,
      log.nodeId,
      log.practiceMinutes,
      log.notes?.trim() ? log.notes : undefined,
    ]),
  }
}

export function expandCompressedCompletionLogs(
  compressed: CompressedCompletionLogsV1,
): CompressibleQuestCompletionLog[] {
  if (compressed.v !== 1) {
    throw new Error('Unsupported compressed completion log version')
  }
  const logs: CompressibleQuestCompletionLog[] = []
  for (const row of compressed.rows) {
    if (
      !Array.isArray(row) ||
      typeof row[0] !== 'number' ||
      typeof row[1] !== 'string' ||
      typeof row[2] !== 'number' ||
      typeof row[3] !== 'string' ||
      typeof row[4] !== 'string' ||
      (row[5] !== undefined && typeof row[5] !== 'number') ||
      (row[6] !== undefined && typeof row[6] !== 'string')
    ) {
      throw new Error('Malformed compressed completion log row')
    }
    logs.push({
      questId: row[0],
      completedAt: row[1],
      xpEarned: row[2],
      difficulty: row[3],
      nodeId: row[4],
      practiceMinutes: typeof row[5] === 'number' ? row[5] : undefined,
      notes: typeof row[6] === 'string' ? row[6] : undefined,
    })
  }
  return logs
}

function isCompressedCompletionLogsV1(value: unknown): value is CompressedCompletionLogsV1 {
  if (!isRecord(value)) return false
  const obj = value as Record<string, unknown>
  return obj.v === 1 && Array.isArray(obj.rows)
}

export function expandPayloadCompletionLogs(payload: Record<string, unknown>): Record<string, unknown> {
  const compressed = payload.questCompletionLogsCompressed
  if (compressed == null) return payload
  if (!isCompressedCompletionLogsV1(compressed)) {
    throw new Error('Invalid compressed completion logs')
  }
  if (Array.isArray(payload.questCompletionLogs) && payload.questCompletionLogs.length > 0) {
    throw new Error('Progress import contains both plain and compressed completion logs')
  }
  const logs = expandCompressedCompletionLogs(compressed)
  const { questCompletionLogsCompressed: _compressed, ...rest } = payload
  void _compressed
  return {
    ...rest,
    questCompletionLogs: logs,
  }
}
