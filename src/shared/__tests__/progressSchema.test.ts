import { describe, it, expect } from 'vitest'
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  migrateProgressPayload,
  parseProgressPayload,
  normalizeProgressPayload,
  normalizeProgressPayloadResult,
  pickLoadedProgressFields,
} from '../progressSchema'
import { mergeProgressChunks, splitProgressIntoChunks } from '../progressChunkMerge'

describe('progressSchema', () => {
  it('migrates legacy payload without schemaVersion', () => {
    const legacy = {
      completedQuests: [1, 2],
      completedToday: [1],
      dailyQuestsIds: [10, 11],
      lastDailyQuestDate: '2026-05-18',
      settings: { soundEnabled: false, language: 'ru' },
      streakState: { current: 3, longest: 5, lastActiveDate: '2026-05-17' },
    }
    const parsed = parseProgressPayload(legacy)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION)
    expect(parsed.data.completedQuests).toEqual([1, 2])
    expect(parsed.data.settings.language).toBe('ru')
    expect(parsed.data.settings.portraitGender).toBe('male')
  })

  it('strips legacy settings keys from save', () => {
    const raw = {
      settings: { soundEnabled: true, language: 'en', portraitAnimation: 'spine' },
    }
    const parsed = parseProgressPayload(raw)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect('portraitAnimation' in parsed.data.settings).toBe(false)
  })

  it('rejects non-object payloads', () => {
    expect(normalizeProgressPayload(null)).toBeNull()
    expect(normalizeProgressPayload('bad')).toBeNull()
  })

  it('strips invalid feedbackStats and questReviewSchedule entries during migration', () => {
    const raw = {
      feedbackStats: {
        '42': { count: 2, avgDifficulty: 3, weakCriteria: ['proportion'] },
        bad: { count: -1, avgDifficulty: 3, weakCriteria: [] },
      },
      questReviewSchedule: {
        '7': { nextReviewAt: '2026-06-10', intervalDays: 3, easeFactor: 2.5 },
        broken: { nextReviewAt: '2026-06-10', intervalDays: 0, easeFactor: 2.5 },
      },
    }
    const parsed = parseProgressPayload(raw)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.feedbackStats).toEqual({
      '42': { count: 2, avgDifficulty: 3, weakCriteria: ['proportion'] },
    })
    expect(parsed.data.questReviewSchedule).toEqual({
      '7': { nextReviewAt: '2026-06-10', intervalDays: 3, easeFactor: 2.5 },
    })
  })

  it('round-trips zh-tw quest title overrides', () => {
    const raw = {
      questTitleOverrides: {
        '42': { 'zh-tw': '自訂標題', en: 'Custom' },
      },
    }
    const parsed = parseProgressPayload(raw)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.questTitleOverrides['42']).toEqual({ 'zh-tw': '自訂標題', en: 'Custom' })
  })

  it('strips invalid questTitleOverrides entries including zh-tw', () => {
    const raw = {
      questTitleOverrides: {
        '1000001': { en: 'Custom', 'zh-tw': '自訂' },
        bad: { en: 123 },
      },
    }
    const parsed = parseProgressPayload(raw)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.questTitleOverrides).toEqual({
      '1000001': { en: 'Custom', 'zh-tw': '自訂' },
    })
  })

  it('reports schema_failed when entire payload cannot be validated', () => {
    const result = normalizeProgressPayloadResult({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      settings: { language: 'not-a-language' },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('schema_failed')
    expect(result.hadRawData).toBe(true)
  })

  it('strips invalid skill nodes and logs', () => {
    const raw = {
      skillNodes: [{ id: 'drawing_fundamentals', bogus: true }],
      questCompletionLogs: [{ questId: 1 }],
    }
    const parsed = parseProgressPayload(raw)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.skillNodes).toHaveLength(0)
    expect(parsed.data.questCompletionLogs).toHaveLength(0)
  })

  it('preserves questSavedReferences through pickLoadedProgressFields', () => {
    const refs = {
      '42': [{ id: 'ref_1', path: '/userData/refs/a.png', addedAt: '2026-06-01T12:00:00.000Z' }],
    }
    const parsed = parseProgressPayload({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      questSavedReferences: refs,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      questTitleOverrides: {},
      completedQuests: [],
      completedWorks: [],
      questCompletionLogs: [],
      settings: {
        soundEnabled: true,
        soundVolume: 0.3,
        language: 'en',
        favoriteCategories: ['drawing'],
        useRandomCategories: false,
        minimizeToTray: false,
        openAtLogin: false,
        remindersEnabled: false,
        reminderHour: 18,
        reminderMinute: 0,
        fontScale: 'medium',
        contrastBoost: false,
        reduceMotion: false,
        hasSeenOnboarding: true,
        materialFavoriteIds: [],
        materialCustomLinks: [],
        portraitGender: 'male',
        learningProfile: 'animation',
        profileSetupComplete: true,
        theme: 'light',
      },
      streakState: { current: 0, longest: 0, lastActiveDate: '' },
      adaptiveWeights: { default: 1 },
      lastRefreshDate: '',
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
      dailyBonusGrantedDate: '',
      weeklyChallengeWeek: '',
      weeklyChallengeQuestId: 0,
      weeklyChallengeCompletedWeek: '',
    })
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    const loaded = pickLoadedProgressFields(parsed.data)
    expect(loaded.questSavedReferences).toEqual(refs)
  })

  it('round-trips questSavedReferences through chunk split/merge', () => {
    const refs = {
      '7': [{ id: 'ref_7', path: '/gallery/ref.png', addedAt: '2026-06-02T08:00:00.000Z' }],
    }
    const full = migrateProgressPayload({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      questSavedReferences: refs,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      questTitleOverrides: {},
      completedQuests: [],
      completedWorks: [],
      questCompletionLogs: [],
      settings: {
        soundEnabled: true,
        soundVolume: 0.3,
        language: 'en',
        favoriteCategories: ['drawing'],
        useRandomCategories: false,
        minimizeToTray: false,
        openAtLogin: false,
        remindersEnabled: false,
        reminderHour: 18,
        reminderMinute: 0,
        fontScale: 'medium',
        contrastBoost: false,
        reduceMotion: false,
        hasSeenOnboarding: true,
        materialFavoriteIds: [],
        materialCustomLinks: [],
        portraitGender: 'male',
        learningProfile: 'animation',
        profileSetupComplete: true,
        theme: 'light',
      },
      streakState: { current: 0, longest: 0, lastActiveDate: '' },
      adaptiveWeights: { default: 1 },
      lastRefreshDate: '',
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
      dailyBonusGrantedDate: '',
      weeklyChallengeWeek: '',
      weeklyChallengeQuestId: 0,
      weeklyChallengeCompletedWeek: '',
    })
    const merged = mergeProgressChunks(splitProgressIntoChunks(full))
    expect(merged.questSavedReferences).toEqual(refs)
  })

  it('round-trips buildProgressData shape', () => {
    const payload = migrateProgressPayload({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      questTitleOverrides: {},
      completedQuests: [],
      completedWorks: [],
      questCompletionLogs: [],
      settings: {
        soundEnabled: true,
        soundVolume: 0.3,
        language: 'en',
        favoriteCategories: ['drawing'],
        useRandomCategories: false,
        minimizeToTray: false,
        openAtLogin: false,
        remindersEnabled: false,
        reminderHour: 18,
        reminderMinute: 0,
        fontScale: 'medium',
        contrastBoost: false,
        reduceMotion: false,
        hasSeenOnboarding: true,
        materialFavoriteIds: [],
        materialCustomLinks: [],
        portraitGender: 'male',
        learningProfile: 'animation',
        profileSetupComplete: false,
        theme: 'light',
      },
      streakState: { current: 0, longest: 0, lastActiveDate: '' },
      adaptiveWeights: { default: 1 },
      lastRefreshDate: '',
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
      dailyBonusGrantedDate: '',
    })
    const parsed = parseProgressPayload(payload)
    expect(parsed.success).toBe(true)
  })
})
