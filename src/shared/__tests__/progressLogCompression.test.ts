import { describe, expect, it } from 'vitest'
import { parseProgressPayload } from '../progressSchema'
import {
  compressCompletionLogsForExport,
  expandCompressedCompletionLogs,
  expandPayloadCompletionLogs,
  shouldCompressCompletionLogsForExport,
} from '../progressLogCompression'

describe('progressLogCompression', () => {
  it('expands compressed export logs before strict progress parsing', () => {
    const logs = Array.from({ length: 90 }, (_, i) => ({
      questId: i + 1,
      nodeId: 'drawing_fundamentals',
      completedAt: '2026-06-04T12:00:00.000Z',
      xpEarned: 10,
      difficulty: 'novice',
    }))

    expect(shouldCompressCompletionLogsForExport(logs)).toBe(true)

    const payload = expandPayloadCompletionLogs({
      questCompletionLogs: [],
      questCompletionLogsCompressed: compressCompletionLogsForExport(logs),
      completedQuests: [],
    })

    const parsed = parseProgressPayload(payload)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.questCompletionLogs).toHaveLength(90)
    expect(parsed.data.questCompletionLogs[0]?.questId).toBe(1)
  })

  it('rejects malformed compressed rows instead of dropping them silently', () => {
    expect(() =>
      expandCompressedCompletionLogs({
        v: 1,
        rows: [[1, '2026-06-04T12:00:00.000Z', 10, 'novice', 123 as unknown as string]],
      }),
    ).toThrow(/Malformed compressed completion log row/)
  })

  it('rejects payloads that contain both plain and compressed completion logs', () => {
    const compressed = compressCompletionLogsForExport([
      {
        questId: 1,
        nodeId: 'drawing_fundamentals',
        completedAt: '2026-06-04T12:00:00.000Z',
        xpEarned: 10,
        difficulty: 'novice',
      },
    ])

    expect(() =>
      expandPayloadCompletionLogs({
        questCompletionLogs: [
          {
            questId: 1,
            nodeId: 'drawing_fundamentals',
            completedAt: '2026-06-04T12:00:00.000Z',
            xpEarned: 10,
            difficulty: 'novice',
          },
        ],
        questCompletionLogsCompressed: compressed,
      }),
    ).toThrow(/both plain and compressed/)
  })

  it('rejects unsupported compressed log versions', () => {
    expect(() =>
      expandPayloadCompletionLogs({
        questCompletionLogs: [],
        questCompletionLogsCompressed: { v: 2, rows: [] },
      }),
    ).toThrow(/Invalid compressed completion logs/)
  })
})
