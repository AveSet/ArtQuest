import { describe, it, expect } from 'vitest'
import { buildExportEnvelope, parseImportEnvelope, stripGalleryBinary } from '../progressExport'

describe('progressExport', () => {
  it('round-trips progress envelope', () => {
    const payload = {
      schemaVersion: 12,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      questTitleOverrides: {},
      completedQuests: [1],
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
        learningProfile: 'animation',
        portraitGender: 'male',
        profileSetupComplete: true,
        theme: 'light',
      },
      streakState: { current: 3, longest: 5, lastActiveDate: '2026-01-01' },
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
      microChallengesCompleted: {},
      questReviewSchedule: {},
      feedbackStats: {},
    }
    const envelope = buildExportEnvelope(payload)
    const parsed = parseImportEnvelope(envelope)
    expect(parsed?.completedQuests).toEqual([1])
  })

  it('strips base64 from gallery when not including media', () => {
    const stripped = stripGalleryBinary(
      {
        completedWorks: [{ questId: 1, imageUrl: 'data:image/png;base64,abc', date: '2026-01-01' }],
      },
      false,
    )
    const works = stripped.completedWorks as { imageUrl: string }[]
    expect(works[0]?.imageUrl).toBe('')
  })
})
