import { describe, it, expect } from 'vitest'
import {
  compressCompletionLogsForExport,
  expandCompressedCompletionLogs,
  shouldCompressCompletionLogsForExport,
} from '../progressLogExport'
import { buildExportEnvelope, parseImportEnvelope } from '../progressExport'

describe('progressLogExport', () => {
  it('compresses and expands logs', () => {
    const logs = Array.from({ length: 100 }, (_, i) => ({
      questId: i + 1,
      nodeId: 'n1',
      completedAt: '2026-01-01T00:00:00.000Z',
      xpEarned: 10,
      difficulty: 'novice' as const,
    }))
    expect(shouldCompressCompletionLogsForExport(logs)).toBe(true)
    const compressed = compressCompletionLogsForExport(logs)
    const back = expandCompressedCompletionLogs(compressed)
    expect(back).toHaveLength(100)
    expect(back[0]?.questId).toBe(1)
  })

  it('round-trips through export envelope', () => {
    const logs = Array.from({ length: 90 }, (_, i) => ({
      questId: i,
      nodeId: 'n',
      completedAt: '2026-02-01',
      xpEarned: 5,
      difficulty: 'intermediate' as const,
    }))
    const envelope = buildExportEnvelope({
      schemaVersion: 12,
      questCompletionLogs: logs,
      completedQuests: [],
    })
    const payload = envelope.payload as Record<string, unknown>
    expect(payload.questCompletionLogsCompressed).toBeTruthy()
    expect(payload.questCompletionLogs).toEqual([])

    const imported = parseImportEnvelope(envelope)
    expect(imported?.questCompletionLogs).toHaveLength(90)
  })
})
