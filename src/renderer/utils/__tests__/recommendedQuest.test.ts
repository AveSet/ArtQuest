import { describe, it, expect } from 'vitest'
import { computeAvgSkillLevel, pickRecommendedQuest, getRecommendedQuestReasonText } from '../recommendedQuest'
import { translations } from '@/i18n/translations'
import type { QuestCompletionLog } from '@/store/models'
import type { Quest, SkillNode } from '@/store/models'

function q(partial: Partial<Quest> & Pick<Quest, 'id' | 'category'>): Quest {
  return {
    code: '',
    title: { en: '', ru: '', zh: '', ja: '', ko: '' },
    difficulty: 'novice',
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    xp: 10,
    estimatedTime: 15,
    source: '',
    icon: '',
    color: '',
    min_level: 1,
    tags: [],
    prerequisites: [],
    medium: 'both',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
    ...partial,
  } as Quest
}

function node(id: string, category: Quest['category'], level: number): SkillNode {
  return {
    id,
    parentId: null,
    category,
    title: { en: id, ru: id, zh: id, ja: id, ko: id },
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    level,
    xp: 0,
    maxXp: 290,
    prerequisites: [],
    tags: [],
    reviewIntervalDays: 0,
    lastReviewDate: null,
    isUnlocked: true,
    order: 0,
    prestige: 0,
  }
}

describe('recommendedQuest', () => {
  it('returns null while daily quests remain', () => {
    const daily = q({ id: 2, category: 'drawing', min_level: 1 })
    const other = q({ id: 3, category: 'anatomy', min_level: 1 })
    const r = pickRecommendedQuest({
      quests: [daily, other],
      completedQuests: [],
      dailyQuests: [daily, other],
      completedToday: [],
      skillNodes: [],
    })
    expect(r).toBeNull()
  })

  it('skipDailyGate returns focus pick while dailies remain', () => {
    const daily = q({ id: 2, category: 'drawing', tags: ['line'], min_level: 1 })
    const focus = q({ id: 3, category: 'drawing', tags: ['proportion'], min_level: 1 })
    const r = pickRecommendedQuest({
      quests: [daily, focus],
      completedQuests: [],
      dailyQuests: [daily],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 1)],
      focusTags: ['proportion'],
      skipDailyGate: true,
    })
    expect(r?.quest.id).toBe(3)
    expect(r?.reason).toBe('weakest_track')
  })

  it('boosts quests with adaptive weight tags', () => {
    const tagged = q({ id: 20, category: 'drawing', tags: ['perspective'], min_level: 1 })
    const plain = q({ id: 21, category: 'drawing', tags: ['other'], min_level: 1 })
    const pool = [plain, tagged]
    const adaptiveBoost = (quest: Quest): number => {
      const weights = { perspective: 2, other: 0.5 }
      const matches = quest.tags.map((tag) => weights[tag as keyof typeof weights] ?? 0)
      return matches.reduce((a, b) => a + b, 0) / matches.length
    }
    const sorted = [...pool].sort((a, b) => adaptiveBoost(b) - adaptiveBoost(a))
    expect(sorted[0]?.id).toBe(20)
    const r = pickRecommendedQuest({
      quests: [tagged],
      completedQuests: [],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 1)],
      adaptiveWeights: { perspective: 2, other: 0.5 },
    })
    expect(r?.quest.id).toBe(20)
  })

  it('when dailies done, picks from weighted category pool (weakest on low roll)', () => {
    const drawingQuest = q({ id: 10, category: 'drawing', difficulty: 'novice', min_level: 1 })
    const anatomyQuest = q({ id: 11, category: 'anatomy', difficulty: 'novice', min_level: 1 })
    const skillNodes: SkillNode[] = [
      node('d1', 'drawing', 5),
      node('a1', 'anatomy', 0),
    ]
    const r = pickRecommendedQuest({
      quests: [drawingQuest, anatomyQuest],
      completedQuests: [],
      dailyQuests: [drawingQuest],
      completedToday: [drawingQuest.id],
      skillNodes,
      dateStr: '2026-01-01',
    })
    expect(r?.reason).toBe('weakest_track')
    expect(r?.quest.category).toBe('anatomy')
  })

  it('excludes completed non-repeatable quests', () => {
    const done = q({ id: 20, category: 'drawing', min_level: 1 })
    const next = q({ id: 21, category: 'drawing', min_level: 1 })
    const r = pickRecommendedQuest({
      quests: [done, next],
      completedQuests: [20],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 0)],
    })
    expect(r?.quest.id).toBe(21)
  })

  it('computeAvgSkillLevel is at least 1', () => {
    expect(computeAvgSkillLevel([])).toBe(1)
    expect(computeAvgSkillLevel([node('a', 'drawing', 0), node('b', 'drawing', 0)])).toBe(1)
  })

  it('skips quests with unsatisfied prerequisites', () => {
    const locked = q({ id: 40, category: 'drawing', min_level: 1, prerequisites: [99] })
    const unlocked = q({ id: 41, category: 'drawing', min_level: 1 })
    const prereq = q({ id: 99, category: 'drawing', min_level: 1 })
    const r = pickRecommendedQuest({
      quests: [locked, unlocked, prereq],
      completedQuests: [],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 0)],
      dateStr: '2026-06-10',
    })
    expect(r?.quest.id).toBe(41)
  })

  it('unlocks dependent when prerequisite satisfied via logs', () => {
    const prereq = q({ id: 50, category: 'drawing', min_level: 1, is_repeatable: false })
    const dependent = q({ id: 51, category: 'drawing', min_level: 1, prerequisites: [50], is_repeatable: false })
    const logs = [{ questId: 50, completedAt: new Date().toISOString() }] as QuestCompletionLog[]
    const r = pickRecommendedQuest({
      quests: [prereq, dependent],
      completedQuests: [],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 0)],
      questCompletionLogs: logs,
    })
    expect(r?.quest.id).toBe(51)
  })

  it('varies recommended quest across dates when candidates are tied', () => {
    const quests = [
      q({ id: 60, category: 'drawing', difficulty: 'novice', min_level: 1 }),
      q({ id: 61, category: 'drawing', difficulty: 'novice', min_level: 1 }),
      q({ id: 62, category: 'drawing', difficulty: 'novice', min_level: 1 }),
    ]
    const skillNodes = [node('d1', 'drawing', 2)]
    const picks = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07'].map(
      (dateStr) =>
        pickRecommendedQuest({
          quests,
          completedQuests: [],
          dailyQuests: [],
          completedToday: [],
          skillNodes,
          dateStr,
        })?.quest.id,
    )
    expect(new Set(picks).size).toBeGreaterThan(1)
  })

  it('deprioritizes quests completed in the last week', () => {
    const recent = q({ id: 70, category: 'drawing', min_level: 1 })
    const fresh = q({ id: 71, category: 'drawing', min_level: 1 })
    const logs = [{ questId: 70, completedAt: new Date().toISOString() }] as QuestCompletionLog[]
    const r = pickRecommendedQuest({
      quests: [recent, fresh],
      completedQuests: [],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [node('d1', 'drawing', 1)],
      questCompletionLogs: logs,
      dateStr: '2026-03-01',
    })
    expect(r?.quest.id).toBe(71)
  })

  it('prefers quests matching weak criterion tags when dailies done', () => {
    const lineQuest = q({ id: 30, category: 'drawing', tags: ['line', 'sketch'], min_level: 1 })
    const other = q({ id: 31, category: 'drawing', tags: ['color'], min_level: 1 })
    const r = pickRecommendedQuest({
      quests: [lineQuest, other],
      completedQuests: [],
      dailyQuests: [lineQuest],
      completedToday: [lineQuest.id],
      skillNodes: [node('d1', 'drawing', 3)],
      weakCriterion: 'line',
    })
    expect(r?.reason).toBe('weak_criterion')
    expect(r?.quest.id).toBe(30)
  })
})

describe('getRecommendedQuestReasonText', () => {
  const dashboard = translations.en.dashboard

  it('maps improvement_focus to gallery-oriented copy', () => {
    expect(getRecommendedQuestReasonText('improvement_focus', dashboard)).toBe(
      dashboard.nextActionImprovementReason,
    )
  })

  it('interpolates weak criterion label', () => {
    const text = getRecommendedQuestReasonText('weak_criterion', dashboard, { criterion: 'line' })
    expect(text).toContain('line')
  })
})
