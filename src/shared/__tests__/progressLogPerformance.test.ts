import { describe, it, expect } from 'vitest'
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  migrateProgressPayload,
  parseProgressPayload,
  validateQuestCompletionLogsAppend,
} from '../progressSchema'

/** Warn thresholds — if exceeded, prefer async save on quit/unload (see progressService). */
export const LOG_PERF_PARSE_WARN_MS = 500
export const LOG_PERF_STRINGIFY_WARN_MS = 200

function makeCompletionLog(i: number) {
  return {
    questId: (i % 50) + 1,
    nodeId: 'drawing_fundamentals',
    completedAt: `2026-05-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
    xpEarned: 10 + (i % 5),
    difficulty: 'novice' as const,
    practiceMinutes: 15,
    category: 'drawing',
    notes: i % 10 === 0 ? `Session note ${i}` : undefined,
    feedback:
      i % 20 === 0
        ? { difficulty: 3, criteria: ['proportion'], mistakeTags: ['hands'] }
        : undefined,
  }
}

function buildPayload(logCount: number) {
  const questCompletionLogs = Array.from({ length: logCount }, (_, i) => makeCompletionLog(i))
  return migrateProgressPayload({
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    skillNodes: [],
    legacySkills: [],
    achievements: [],
    userQuests: [],
    questTitleOverrides: {},
    completedQuests: [],
    completedWorks: [],
    questCompletionLogs,
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
}

function measureMs(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('progress log performance', () => {
  it('parse + stringify at 5k and 10k logs stays within warn thresholds', () => {
    for (const count of [5_000, 10_000] as const) {
      const raw = buildPayload(count)
      const parseMs = measureMs(() => {
        const parsed = parseProgressPayload(raw)
        expect(parsed.success).toBe(true)
      })

      const parsed = parseProgressPayload(raw)
      expect(parsed.success).toBe(true)
      if (!parsed.success) continue

      let jsonLen = 0
      const stringifyMs = measureMs(() => {
        const json = JSON.stringify(parsed.data)
        jsonLen = json.length
      })

      expect(parseMs).toBeLessThan(LOG_PERF_PARSE_WARN_MS)
      expect(stringifyMs).toBeLessThan(LOG_PERF_STRINGIFY_WARN_MS)
      expect(jsonLen).toBeGreaterThan(100_000)

      console.info(
        `[progressLogPerformance] logs=${count} parseMs=${parseMs.toFixed(1)} stringifyMs=${stringifyMs.toFixed(1)} jsonBytes=${jsonLen}`,
      )
    }
  })

  it('append-only validation is fast for large histories', () => {
    const base = Array.from({ length: 9_999 }, (_, i) => makeCompletionLog(i))
    const incoming = [...base, makeCompletionLog(9_999)]
    const appendMs = measureMs(() => {
      expect(validateQuestCompletionLogsAppend(base, incoming)).toBe(true)
    })
    expect(appendMs).toBeLessThan(50)
  })
})
