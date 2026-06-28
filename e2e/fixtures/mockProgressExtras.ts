/** Progress fixtures for Playwright — extend MOCK_PROGRESS for scenario tests. */
import { MOCK_PROGRESS } from './mockProgress'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export const MOCK_PROGRESS_WITH_GOALS = {
  ...MOCK_PROGRESS,
  activeGoal: {
    text: 'Finish a portrait study this week',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  completedGoals: [
    {
      id: 'goal-1',
      text: 'Complete first daily trio',
      createdAt: '2026-05-20T10:00:00.000Z',
      completedAt: '2026-05-25T18:00:00.000Z',
    },
  ],
}

export const MOCK_PROGRESS_WITH_GALLERY = {
  ...MOCK_PROGRESS,
  completedWorks: [
    {
      questId: 1,
      imageUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      date: '2026-06-01T14:00:00.000Z',
      notes: 'Warmup sketch',
    },
  ],
}

export const MOCK_PROGRESS_BEGINNER = {
  ...MOCK_PROGRESS,
  dailyQuestsIds: [],
  completedToday: [],
  settings: {
    ...MOCK_PROGRESS.settings,
    experienceTier: 'beginner' as const,
  },
  fundamentalsProgress: {
    completedIds: [] as number[],
    trackPhaseDone: {} as Record<string, number>,
    lastCompletedDate: '',
  },
}

/** Spaced-review item due on dashboard Review Shelf (quest 1 = effects catalog). */
function isoNow(): string {
  return new Date().toISOString()
}

/** Recent weak line feedback — surfaces in stats monthly summary and dashboard focus. */
export const MOCK_PROGRESS_WITH_FEEDBACK = {
  ...MOCK_PROGRESS,
  lastWarmupCompletedDate: isoDateDaysAgo(0),
  questCompletionLogs: [
    ...MOCK_PROGRESS.questCompletionLogs,
    {
      questId: 2,
      nodeId: 'draw_basics',
      category: 'drawing' as const,
      completedAt: isoNow(),
      xpEarned: 15,
      difficulty: 'intermediate' as const,
      practiceMinutes: 22,
      feedback: {
        difficultyRating: 4,
        criteria: [{ label: 'line', rating: 1 }],
        mistakeTags: ['line'],
      },
    },
  ],
}

export const MOCK_PROGRESS_WITH_GALLERY_NOTES = {
  ...MOCK_PROGRESS,
  completedWorks: [
    {
      questId: 1,
      imageUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      date: '2026-06-01T14:00:00.000Z',
      notes: 'Warmup sketch',
      improvementNotes: 'Push line weight on the outer contour',
      tags: ['line'],
    },
  ],
}

export const MOCK_PROGRESS_CHEST_READY = {
  ...MOCK_PROGRESS,
  portraitProgress: {
    dailyChestStreak: 4,
    lastDailyChestProgressDate: isoDateDaysAgo(1),
    streakShieldUsedMonth: '',
    lastShieldUsedOnDate: '',
  },
}

export const MOCK_PROGRESS_EXPORT_SHAPE = {
  ...MOCK_PROGRESS,
  settings: {
    ...MOCK_PROGRESS.settings,
    materialEngagement: { 'vid-1': 'helpful' as const },
  },
  completedWorks: [
    {
      questId: 1,
      imageUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      date: '2026-06-01T14:00:00.000Z',
      improvementNotes: 'Keep contrast on shadows',
    },
  ],
}

export const MOCK_PROGRESS_WITH_REVIEW = {
  ...MOCK_PROGRESS,
  questCompletionLogs: [
    {
      questId: 1,
      nodeId: 'effects',
      completedAt: isoDaysAgo(20),
      xpEarned: 40,
      difficulty: 'master' as const,
      practiceMinutes: 20,
    },
  ],
  questReviewSchedule: {
    '1': { nextReviewAt: isoDateDaysAgo(5), intervalDays: 7, easeFactor: 2.5 },
  },
}
