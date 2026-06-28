import { describe, expect, it } from 'vitest'
import { getPersonalizedQuestMinutes } from '@/utils/questPersonalizedTime'
import type { Quest, QuestCompletionLog } from '@/store/models'

const baseQuest: Pick<Quest, 'id' | 'estimatedTime' | 'category' | 'difficulty'> = {
  id: 100,
  estimatedTime: 30,
  category: 'drawing',
  difficulty: 'novice',
}

function log(questId: number, minutes: number): QuestCompletionLog {
  return {
    questId,
    nodeId: 'drawing_fundamentals',
    completedAt: '2026-06-01T12:00:00.000Z',
    xpEarned: 10,
    difficulty: 'novice',
    practiceMinutes: minutes,
  }
}

describe('getPersonalizedQuestMinutes', () => {
  it('falls back to catalog with no logs', () => {
    const result = getPersonalizedQuestMinutes(baseQuest, [])
    expect(result.minutes).toBe(30)
    expect(result.confidence).toBe('catalog')
    expect(result.isPersonalized).toBe(false)
  })

  it('uses quest-specific median with enough samples', () => {
    const logs = [20, 22, 24, 26, 28].map((m) => log(100, m))
    const result = getPersonalizedQuestMinutes(baseQuest, logs)
    expect(result.minutes).toBe(25)
    expect(result.confidence).toBe('high')
    expect(result.isPersonalized).toBe(true)
  })

  it('filters speed runs and timeouts from personalization', () => {
    const logs: QuestCompletionLog[] = [
      ...[20, 22, 24, 26, 28].map((m) => log(100, m)),
      { ...log(100, 5), isSpeedRun: true },
      { ...log(100, 8), status: 'timeout' },
    ]
    const result = getPersonalizedQuestMinutes(baseQuest, logs)
    expect(result.minutes).toBe(25)
  })
})
