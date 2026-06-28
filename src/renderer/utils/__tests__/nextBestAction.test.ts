import { describe, it, expect } from 'vitest'
import { buildNextBestAction } from '../nextBestAction'
import type { Quest } from '@/store/models'

function q(partial: Partial<Quest> & Pick<Quest, 'id' | 'category'>): Quest {
  return {
    code: '',
    title: { en: 'Q', ru: 'Q', zh: 'Q', ja: 'Q', ko: 'Q' },
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

describe('buildNextBestAction', () => {
  const today = '2026-05-30'

  it('prioritizes fundamentals for beginner before daily quests', () => {
    const daily = q({ id: 2, category: 'drawing' })
    const action = buildNextBestAction({
      today,
      language: 'en',
      quests: [daily],
      completedQuests: [],
      dailyQuests: [daily],
      completedToday: [],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: '',
      experienceTier: 'beginner',
      fundamentalsProgress: { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' },
      warmupAvailable: true,
    })
    expect(action?.primary.kind).toBe('fundamentals')
    expect(action?.plan.some((s) => s.kind === 'daily_quest')).toBe(false)
  })

  it('prioritizes warmup over incomplete daily when warmup available for intermediate', () => {
    const daily = q({ id: 2, category: 'drawing' })
    const action = buildNextBestAction({
      today,
      language: 'en',
      quests: [daily],
      completedQuests: [],
      dailyQuests: [daily],
      completedToday: [],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: '',
      experienceTier: 'intermediate',
      warmupAvailable: true,
    })
    expect(action?.primary.kind).toBe('warmup')
    expect(action?.plan.some((s) => s.kind === 'daily_quest')).toBe(true)
  })

  it('prioritizes incomplete daily when warmup is done', () => {
    const daily = q({ id: 2, category: 'drawing' })
    const action = buildNextBestAction({
      today,
      language: 'en',
      quests: [daily],
      completedQuests: [],
      dailyQuests: [daily],
      completedToday: [],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: today,
      experienceTier: 'intermediate',
      warmupAvailable: false,
    })
    expect(action?.primary.kind).toBe('daily_quest')
    expect(action?.primary.quest?.id).toBe(2)
  })

  it('counts only daily quest completions in reason params', () => {
    const daily1 = q({ id: 2, category: 'drawing' })
    const daily2 = q({ id: 3, category: 'anatomy' })
    const other = q({ id: 99, category: 'animation' })
    const action = buildNextBestAction({
      today,
      language: 'en',
      quests: [daily1, daily2, other],
      completedQuests: [],
      dailyQuests: [daily1, daily2],
      completedToday: [2, 99],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: today,
      experienceTier: 'intermediate',
      warmupAvailable: false,
    })
    expect(action?.primary.reasonParams?.done).toBe('1')
    expect(action?.primary.reasonParams?.total).toBe('2')
  })

  it('prioritizes daily quest after fundamentals gate for beginner (no warmup)', () => {
    const daily = q({ id: 2, category: 'drawing' })
    const action = buildNextBestAction({
      today,
      language: 'en',
      quests: [daily],
      completedQuests: [],
      dailyQuests: [daily],
      completedToday: [],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: '',
      experienceTier: 'beginner',
      fundamentalsProgress: {
        completedIds: [],
        trackPhaseDone: { novice: 1 },
        lastCompletedDate: today,
      },
      warmupAvailable: true,
    })
    expect(action?.primary.kind).toBe('daily_quest')
    expect(action?.primary.kind).not.toBe('fundamentals')
    expect(action?.primary.kind).not.toBe('warmup')
    expect(action?.plan.some((s) => s.kind === 'daily_quest')).toBe(true)
  })

  it('includes warmup in plan when available for non-beginner', () => {
    const action = buildNextBestAction({
      today,
      language: 'ru',
      quests: [],
      completedQuests: [],
      dailyQuests: [],
      completedToday: [],
      skillNodes: [],
      questCompletionLogs: [],
      questReviewSchedule: {},
      lastWarmupCompletedDate: '',
      experienceTier: 'intermediate',
      warmupAvailable: true,
    })
    expect(action?.primary.kind).toBe('warmup')
    expect(action?.plan.some((s) => s.kind === 'warmup')).toBe(true)
  })
})
