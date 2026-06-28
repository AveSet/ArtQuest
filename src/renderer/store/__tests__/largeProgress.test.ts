import { describe, it, expect, beforeEach } from 'vitest'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import type { QuestCompletionLog } from '@/store/models'

describe('large progress payload', () => {
  beforeEach(() => {
    useQuestStore.setState({ questCompletionLogs: [] })
  })

  it('buildProgressData stays serializable with very large completion logs', () => {
    const logs: QuestCompletionLog[] = Array.from({ length: 8_000 }, (_, i) => ({
      questId: (i % 50) + 1,
      nodeId: 'node_x',
      completedAt: '2026-05-17T12:00:00.000Z',
      xpEarned: 10,
      difficulty: 'novice',
    }))

    useQuestStore.setState({ questCompletionLogs: logs })

    expect(() => {
      const data = useUIStore.getState().buildProgressData()
      const s = JSON.stringify(data)
      expect(s.length).toBeGreaterThan(100_000)
    }).not.toThrow()
  })
})
