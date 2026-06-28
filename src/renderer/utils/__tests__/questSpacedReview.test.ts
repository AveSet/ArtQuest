import { describe, it, expect } from 'vitest'
import { getQuestsDueForReview, scheduleNextReview, pickReviewQuestForDaily, penalizeMissedReviews, MIN_REVIEW_EASE_FACTOR } from '../questSpacedReview'
import type { Quest, QuestCompletionLog } from '@/store/models'

const quest = (id: number, reviewDays: number, repeatable = true): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: 'Q', ru: 'Q', zh: 'Q', ja: 'Q', ko: 'Q' },
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
  is_repeatable: repeatable,
  review_after_days: reviewDays,
  streak_bonus: 1,
})

describe('questSpacedReview', () => {
  it('returns quests due via legacy review_after_days when no schedule entry', () => {
    const q = quest(5, 7)
    const old = new Date()
    old.setDate(old.getDate() - 10)
    const logs: QuestCompletionLog[] = [
      {
        questId: 5,
        nodeId: '',
        completedAt: old.toISOString(),
        xpEarned: 40,
        difficulty: 'novice',
      },
    ]
    const today = new Date().toISOString().slice(0, 10)
    const due = getQuestsDueForReview({}, logs, [q], today)
    expect(due.map((x) => x.id)).toContain(5)
  })

  it('returns quests due when schedule nextReviewAt has passed', () => {
    const q = quest(5, 7)
    const today = new Date().toISOString().slice(0, 10)
    const past = new Date()
    past.setDate(past.getDate() - 3)
    const schedule = scheduleNextReview({}, 5, 7, past.toISOString())
    schedule['5']!.nextReviewAt = past.toISOString().slice(0, 10)
    const due = getQuestsDueForReview(schedule, [], [q], today)
    expect(due.map((x) => x.id)).toContain(5)
  })

  it('includes repeatable quests completed only in logs (not in completedQuests)', () => {
    const q = quest(5, 3, true)
    const old = new Date()
    old.setDate(old.getDate() - 5)
    const logs: QuestCompletionLog[] = [
      {
        questId: 5,
        nodeId: '',
        completedAt: old.toISOString(),
        xpEarned: 40,
        difficulty: 'novice',
      },
    ]
    const today = new Date().toISOString().slice(0, 10)
    const due = getQuestsDueForReview({}, logs, [q], today)
    expect(due.map((x) => x.id)).toContain(5)
  })

  it('schedules next review with increasing interval', () => {
    const now = new Date().toISOString()
    const next = scheduleNextReview({}, 5, 7, now)
    expect(next['5']?.intervalDays).toBeGreaterThanOrEqual(7)
  })

  it('picks review quest for daily slot', () => {
    const id = pickReviewQuestForDaily([quest(1, 7), quest(2, 14)], [], 42)
    expect(id).toBeDefined()
  })

  it('decreases easeFactor for overdue reviews (min 1.3)', () => {
    const today = '2026-06-07'
    const schedule = {
      '5': {
        nextReviewAt: '2026-06-01',
        intervalDays: 7,
        easeFactor: 2.5,
      },
    }
    const next = penalizeMissedReviews(schedule, today)
    expect(next['5']?.easeFactor).toBe(2.3)
    expect(next['5']?.nextReviewAt).toBe(today)
  })

  it('does not decrease easeFactor below minimum', () => {
    const today = '2026-06-07'
    const schedule = {
      '5': {
        nextReviewAt: '2026-06-01',
        intervalDays: 7,
        easeFactor: 1.35,
      },
    }
    const next = penalizeMissedReviews(schedule, today)
    expect(next['5']?.easeFactor).toBe(MIN_REVIEW_EASE_FACTOR)
  })
})
