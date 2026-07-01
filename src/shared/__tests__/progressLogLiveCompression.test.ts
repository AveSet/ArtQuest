import { describe, it, expect } from 'vitest'
import {
  COMPRESS_LIVE_MIN_LOGS,
  RECENT_TAIL_SIZE,
  packQuestCompletionLogsForStorage,
  unpackQuestCompletionLogsFromStorage,
  shouldCompressCompletionLogsLive,
} from '../progressLogLiveCompression'
import { migrateProgressPayload, parseProgressPayload } from '../progressSchema'

function makeLog(i: number) {
  return {
    questId: (i % 50) + 1,
    nodeId: 'drawing_fundamentals',
    completedAt: `2026-05-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
    xpEarned: 10,
    difficulty: 'novice',
    practiceMinutes: 15,
    category: 'drawing',
  }
}

describe('progressLogLiveCompression', () => {
  it('does not compress below threshold', () => {
    const logs = Array.from({ length: COMPRESS_LIVE_MIN_LOGS - 1 }, (_, i) => makeLog(i))
    const packed = packQuestCompletionLogsForStorage(logs)
    expect(packed.questCompletionLogs).toHaveLength(logs.length)
    expect(packed.compressedLogs).toBeUndefined()
  })

  it('packs compressedLogs + recentTail at threshold', () => {
    const logs = Array.from({ length: COMPRESS_LIVE_MIN_LOGS }, (_, i) => makeLog(i))
    expect(shouldCompressCompletionLogsLive(logs.length)).toBe(true)
    const packed = packQuestCompletionLogsForStorage(logs)
    expect(packed.compressedLogs).toBeTruthy()
    expect(packed.recentTail).toHaveLength(RECENT_TAIL_SIZE)
    expect(packed.questCompletionLogs).toBeUndefined()
  })

  it('round-trips through migrateProgressPayload', () => {
    const logs = Array.from({ length: 250 }, (_, i) => makeLog(i))
    const packed = packQuestCompletionLogsForStorage(logs)
    const migrated = migrateProgressPayload({
      schemaVersion: 25,
      skillNodes: [],
      legacySkills: [],
      achievements: [],
      userQuests: [],
      questTitleOverrides: {},
      completedQuests: [],
      completedWorks: [],
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
      ...packed,
    })
    const parsed = parseProgressPayload(migrated)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.questCompletionLogs).toHaveLength(250)
    expect(unpackQuestCompletionLogsFromStorage(packed)).toHaveLength(250)
  })
})
