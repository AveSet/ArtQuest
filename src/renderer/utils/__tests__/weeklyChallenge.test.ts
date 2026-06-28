import { describe, it, expect } from 'vitest'
import { getIsoWeekKey, pickWeeklyChallengeQuestId, isWeeklyChallengeComplete } from '../weeklyChallenge'
import type { Quest } from '@/store/models'

const baseQuest = (id: number, diff: Quest['difficulty'] = 'intermediate'): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: `Quest ${id}`, ru: `Квест ${id}`, zh: `Quest ${id}`, ja: `Quest ${id}`, ko: `Quest ${id}` },
  category: 'drawing',
  difficulty: diff,
  description: { en: 'd', ru: 'д', zh: 'd', ja: 'd', ko: 'd' },
  xp: 50,
  estimatedTime: 30,
  source: 't',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 1,
})

describe('weeklyChallenge', () => {
  it('getIsoWeekKey returns stable W format', () => {
    const k = getIsoWeekKey(new Date('2026-05-18T12:00:00'))
    expect(k).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('pickWeeklyChallengeQuestId is deterministic per week', () => {
    const quests = [baseQuest(1), baseQuest(2, 'advanced'), baseQuest(3)]
    const a = pickWeeklyChallengeQuestId(quests, '2026-W10', [])
    const b = pickWeeklyChallengeQuestId(quests, '2026-W10', [])
    expect(a).toBe(b)
    expect(a).not.toBeNull()
  })

  it('isWeeklyChallengeComplete when quest done in week', () => {
    const week = getIsoWeekKey()
    expect(isWeeklyChallengeComplete(week, week, 42, [42])).toBe(true)
    expect(isWeeklyChallengeComplete(week, '', 42, [42])).toBe(false)
  })

  it('isWeeklyChallengeComplete when week flag set without completedQuests (repeatable)', () => {
    const week = getIsoWeekKey()
    expect(isWeeklyChallengeComplete(week, week, 99, [])).toBe(true)
  })
})
