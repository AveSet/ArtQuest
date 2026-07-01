/** Large progress fixture for soft perf/resilience E2E (2000 completion logs). */
import { MOCK_PROGRESS } from './mockProgress'

const LOGS = Array.from({ length: 2000 }, (_, i) => ({
  questId: (i % 50) + 1,
  nodeId: 'draw_basics',
  completedAt: new Date(Date.UTC(2024, 0, 1) + i * 86_400_000).toISOString(),
  xpEarned: 10 + (i % 20),
  difficulty: 'novice' as const,
  practiceMinutes: 15 + (i % 10),
}))

export const MOCK_PROGRESS_LARGE = {
  ...MOCK_PROGRESS,
  questCompletionLogs: LOGS,
  completedQuests: Array.from({ length: 50 }, (_, i) => i + 1),
}
