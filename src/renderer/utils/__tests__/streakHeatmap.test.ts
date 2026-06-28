import { describe, it, expect } from 'vitest'
import { buildStreakHeatmap, practiceDaysFromLogs, toLocalIsoDate } from '../streakHeatmap'

describe('streakHeatmap', () => {
  it('marks active days from logs', () => {
    const days = practiceDaysFromLogs([
      { completedAt: '2026-05-20T12:00:00.000Z' },
      { completedAt: '2026-05-20T18:00:00.000Z' },
    ])
    expect(days).toHaveLength(1)
    expect(days[0]).toBe(toLocalIsoDate('2026-05-20T12:00:00.000Z'))
  })

  it('builds fixed week grid', () => {
    const grid = buildStreakHeatmap(['2026-05-01'], 4, new Date('2026-05-28T12:00:00'))
    expect(grid.cells).toHaveLength(28)
    expect(grid.cells.some((c) => c.active)).toBe(true)
  })
})
