import { describe, it, expect } from 'vitest'
import { buildReviewShelfItems } from '../reviewShelf'
import type { Quest, QuestCompletionLog } from '@/store/models'

const makeQuest = (id: number, reviewDays = 7): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: `Quest ${id}`, ru: `Q${id}`, zh: 'Q', ja: 'Q', ko: 'Q' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 40,
  estimatedTime: 20,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: reviewDays,
  streak_bonus: 1,
})

describe('buildReviewShelfItems', () => {
  it('returns empty list when there are no completion logs', () => {
    const items = buildReviewShelfItems([makeQuest(1)], [], {}, '2026-06-13', (q) => q.title.en)
    expect(items).toEqual([])
  })

  it('builds legacy overdue items from review_after_days', () => {
    const quest = makeQuest(5, 7)
    const logs: QuestCompletionLog[] = [
      {
        questId: 5,
        nodeId: '',
        completedAt: '2026-05-20T12:00:00.000Z',
        xpEarned: 40,
        difficulty: 'novice',
      },
    ]
    const items = buildReviewShelfItems([quest], logs, {}, '2026-06-13', (q) => q.title.en)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      questId: 5,
      questTitle: 'Quest 5',
      reason: 'legacy',
    })
    expect(items[0]!.daysOverdue).toBeGreaterThanOrEqual(1)
  })

  it('marks scheduled reviews and caps at maxItems', () => {
    const quests = [makeQuest(1), makeQuest(2), makeQuest(3), makeQuest(4), makeQuest(5)]
    const schedule = {
      '1': { nextReviewAt: '2026-06-01', intervalDays: 7, easeFactor: 2.5 },
      '2': { nextReviewAt: '2026-06-05', intervalDays: 7, easeFactor: 2.5 },
      '3': { nextReviewAt: '2026-06-10', intervalDays: 7, easeFactor: 2.5 },
      '4': { nextReviewAt: '2026-06-11', intervalDays: 7, easeFactor: 2.5 },
      '5': { nextReviewAt: '2026-06-12', intervalDays: 7, easeFactor: 2.5 },
    }
    const logs: QuestCompletionLog[] = quests.map((q) => ({
      questId: q.id,
      nodeId: '',
      completedAt: '2026-05-01T12:00:00.000Z',
      xpEarned: 40,
      difficulty: 'novice' as const,
    }))

    const items = buildReviewShelfItems(quests, logs, schedule, '2026-06-13', (q) => q.title.en, 3)
    expect(items).toHaveLength(3)
    expect(items.every((item) => item.reason === 'scheduled')).toBe(true)
    expect(items[0]!.daysOverdue).toBeGreaterThanOrEqual(items[1]!.daysOverdue)
  })
})
