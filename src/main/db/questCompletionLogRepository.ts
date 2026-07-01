import { getDb, nowIso, randomId, runTransaction } from '../localDb/dbCore'

export type QuestCompletionLogRow = Record<string, unknown>

function logEntryId(entry: QuestCompletionLogRow): string {
  const questId = entry.questId
  const completedAt = entry.completedAt
  if (typeof questId === 'number' && typeof completedAt === 'string' && completedAt.length > 0) {
    return `qcl_${questId}_${completedAt}`
  }
  return randomId('qcl')
}

export function countCompletionLogs(): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS count FROM quest_completion_log')
    .get() as { count: number }
  return row?.count ?? 0
}

export function getCompletionLogSummary(): { totalCount: number; updatedAt: string } {
  const row = getDb()
    .prepare('SELECT total_count, updated_at FROM quest_completion_summary WHERE id = 1')
    .get() as { total_count: number; updated_at: string } | undefined
  if (!row) {
    return { totalCount: countCompletionLogs(), updatedAt: nowIso() }
  }
  return { totalCount: row.total_count, updatedAt: row.updated_at }
}

export function updateCompletionLogSummary(totalCount: number): void {
  getDb()
    .prepare(
      `INSERT INTO quest_completion_summary (id, total_count, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET total_count = excluded.total_count, updated_at = excluded.updated_at`,
    )
    .run(totalCount, nowIso())
}

export function appendCompletionLogEntry(entry: QuestCompletionLogRow): boolean {
  if (!entry || typeof entry !== 'object') return false
  const id = logEntryId(entry)
  const completedAt = String(entry.completedAt ?? nowIso())
  try {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO quest_completion_log (id, completed_at, payload_json)
         VALUES (?, ?, ?)`,
      )
      .run(id, completedAt, JSON.stringify(entry))
    const total = countCompletionLogs()
    updateCompletionLogSummary(total)
    return true
  } catch (err) {
    console.warn('[db] append completion log failed:', err)
    return false
  }
}

export function appendCompletionLogBatch(entries: QuestCompletionLogRow[]): number {
  if (!Array.isArray(entries) || entries.length === 0) return 0
  let inserted = 0
  runTransaction(() => {
    const stmt = getDb().prepare(
      `INSERT OR IGNORE INTO quest_completion_log (id, completed_at, payload_json)
       VALUES (?, ?, ?)`,
    )
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const result = stmt.run(
        logEntryId(entry),
        String(entry.completedAt ?? nowIso()),
        JSON.stringify(entry),
      )
      if (result.changes > 0) inserted += 1
    }
    updateCompletionLogSummary(countCompletionLogs())
  })
  return inserted
}

export function loadAllCompletionLogs(): QuestCompletionLogRow[] {
  const rows = getDb()
    .prepare('SELECT payload_json FROM quest_completion_log ORDER BY completed_at ASC, id ASC')
    .all() as { payload_json: string }[]
  const out: QuestCompletionLogRow[] = []
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.payload_json) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        out.push(parsed as QuestCompletionLogRow)
      }
    } catch {
      //
    }
  }
  return out
}

export function migrateCompletionLogsFromProgress(logs: QuestCompletionLogRow[]): number {
  if (countCompletionLogs() > 0) return 0
  return appendCompletionLogBatch(logs)
}

export function clearCompletionLogs(): void {
  runTransaction(() => {
    getDb().prepare('DELETE FROM quest_completion_log').run()
    getDb().prepare('DELETE FROM quest_completion_summary').run()
  })
}

export function syncCompletionLogsFromIncoming(incoming: QuestCompletionLogRow[]): void {
  const existing = countCompletionLogs()
  if (incoming.length <= existing) return
  appendCompletionLogBatch(incoming.slice(existing))
}
