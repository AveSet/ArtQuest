/** Minimal era-specific progress snapshots for migration contract tests. */

const BASE_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.5,
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
}

const BASE_STREAK = { current: 2, longest: 5, lastActiveDate: '2026-05-10' }

function basePayload(schemaVersion: number, extra: Record<string, unknown> = {}) {
  return {
    skillNodes: [],
    legacySkills: [],
    achievements: [],
    userQuests: [],
    deletedQuestIds: [],
    questTitleOverrides: {},
    completedQuests: [1],
    completedWorks: [],
    questCompletionLogs: [],
    settings: { ...BASE_SETTINGS, theme: 'modern', learningProfile: 'drawing' },
    streakState: BASE_STREAK,
    adaptiveWeights: { default: 1 },
    lastRefreshDate: '',
    dailyQuestsIds: [10],
    completedToday: [],
    lastDailyQuestDate: '2026-05-10',
    lastFavCategories: '',
    dailyBonusGrantedDate: '',
    weeklyChallengeWeek: '',
    weeklyChallengeQuestId: 0,
    weeklyChallengeCompletedWeek: '',
    microChallengesCompleted: {},
    questSavedReferences: {},
    lastWarmupCompletedDate: '',
    fundamentalsProgress: {
      completedIds: [],
      trackPhaseDone: {},
      lastCompletedDate: '',
    },
    ...extra,
    schemaVersion,
  }
}

/** v22-era: review schedule + feedback stats, no fundamentals block shape guarantees. */
export const PROGRESS_SNAPSHOT_V22 = basePayload(22, {
  questReviewSchedule: {
    '42': { nextReviewAt: '2026-06-01', intervalDays: 7, easeFactor: 2.5 },
  },
  feedbackStats: {
    '42': { count: 1, avgDifficulty: 3, weakCriteria: ['proportion'] },
  },
  settings: {
    ...BASE_SETTINGS,
    theme: 'rpg',
    learningProfile: 'animation',
    materialEngagement: { 'mat-1': 'viewed' },
  },
})

/** v23-era: window bounds + long absence return on streak. */
export const PROGRESS_SNAPSHOT_V23 = basePayload(23, {
  questReviewSchedule: PROGRESS_SNAPSHOT_V22.questReviewSchedule,
  feedbackStats: PROGRESS_SNAPSHOT_V22.feedbackStats,
  streakState: {
    ...BASE_STREAK,
    longAbsenceReturnDate: '2026-05-10',
  },
  settings: {
    ...PROGRESS_SNAPSHOT_V22.settings,
    windowBounds: {
      main: { x: 100, y: 80, width: 1200, height: 800 },
    },
    preferredReferenceSource: 'pinterest',
  },
})

/** v24-era: persisted quest session shape. */
export const PROGRESS_SNAPSHOT_V24 = basePayload(24, {
  activeQuestSession: {
    questId: 42,
    mainMinutes: 20,
    referenceMinutes: 5,
    remainingSec: 600,
    isRunning: false,
    isExpired: false,
    startedAtMs: 1_700_000_000_000,
    savedAtMs: 1_700_000_100_000,
    phases: [],
    currentPhaseIndex: 0,
    phaseRemainingSec: 0,
    phasesComplete: false,
  },
})

/** v25-era: compressed completion logs marker (stored as array in fixture). */
export const PROGRESS_SNAPSHOT_V25 = basePayload(25, {
  questCompletionLogs: [
    {
      questId: 7,
      nodeId: 'drawing_fundamentals',
      completedAt: '2026-06-04T12:00:00.000Z',
      xpEarned: 25,
      difficulty: 'novice',
      practiceMinutes: 18,
      feedback: { difficulty: 3, mistakeTags: ['line_confidence'] },
    },
  ],
})

/** v26-era: goals + experience tier. */
export const PROGRESS_SNAPSHOT_V26 = basePayload(26, {
  activeGoal: { text: 'Draw hands daily', createdAt: '2026-06-01T10:00:00.000Z' },
  completedGoals: [],
  settings: {
    ...BASE_SETTINGS,
    theme: 'studio',
    learningProfile: 'drawing',
    experienceTier: 'intermediate',
    energyMode: 'medium',
  },
})

/** v27-era: vfx/audio telemetry fields. */
export const PROGRESS_SNAPSHOT_V27 = basePayload(27, {
  settings: {
    ...BASE_SETTINGS,
    theme: 'light',
    learningProfile: 'drawing',
    vfxQuality: 'enhanced',
    telemetryEnabled: false,
    sfxVolume: 0.6,
    musicVolume: 0.4,
    ambientEnabled: true,
    ambientVolume: 0.1,
  },
})

export const MIGRATION_CONTRACT_FIXTURES = [
  { label: 'v22 review + feedback', payload: PROGRESS_SNAPSHOT_V22 },
  { label: 'v23 window bounds + absence', payload: PROGRESS_SNAPSHOT_V23 },
  { label: 'v24 active session', payload: PROGRESS_SNAPSHOT_V24 },
  { label: 'v25 completion feedback', payload: PROGRESS_SNAPSHOT_V25 },
  { label: 'v26 goals + experience tier', payload: PROGRESS_SNAPSHOT_V26 },
  { label: 'v27 vfx/audio settings', payload: PROGRESS_SNAPSHOT_V27 },
] as const
