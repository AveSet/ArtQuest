import { describe, expect, it } from 'vitest'
import { WARMUP_QUESTS } from '@/data/warmupQuests'
import { getWarmupQuestForDate, isWarmupCompletedToday } from '../warmupQuest'

describe('warmupQuest', () => {
  it('generates exactly 100 unique warmup drills', () => {
    expect(WARMUP_QUESTS).toHaveLength(100)
    expect(new Set(WARMUP_QUESTS.map((q) => q.id)).size).toBe(100)
    expect(WARMUP_QUESTS.every((q) => !q.microChallenges?.length)).toBe(true)
    expect(WARMUP_QUESTS.every((q) => q.estimatedTime === 5)).toBe(true)
    expect(WARMUP_QUESTS.every((q) => q.category === 'drawing')).toBe(true)
    expect(WARMUP_QUESTS.every((q) => q.tags.includes('primitive'))).toBe(true)
  })

  it('localizes titles and descriptions in all supported languages', () => {
    for (const quest of WARMUP_QUESTS) {
      for (const lang of ['en', 'ru', 'zh', 'ja', 'ko'] as const) {
        expect(quest.title[lang]?.trim().length).toBeGreaterThan(3)
        expect(quest.description[lang]?.trim().length).toBeGreaterThan(10)
      }
    }
  })

  it('picks a stable quest for the same date', () => {
    const a = getWarmupQuestForDate('2026-05-29')
    const b = getWarmupQuestForDate('2026-05-29')
    const c = getWarmupQuestForDate('2026-05-30')
    expect(a.id).toBe(b.id)
    expect(c.id).not.toBe(a.id)
  })

  it('tracks once-per-day completion', () => {
    expect(isWarmupCompletedToday('', '2026-05-29')).toBe(false)
    expect(isWarmupCompletedToday('2026-05-28', '2026-05-29')).toBe(false)
    expect(isWarmupCompletedToday('2026-05-29', '2026-05-29')).toBe(true)
  })
})
