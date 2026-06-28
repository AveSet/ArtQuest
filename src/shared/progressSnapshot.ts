import {
  PROGRESS_CHUNK_KEYS,
  type ProgressChunkKey,
} from './progressChunkMerge'

/** Single source of truth: which progress fields belong to each save chunk. */
export const PROGRESS_CHUNK_FIELD_MAP: Record<ProgressChunkKey, readonly string[]> = {
  core: [
    'schemaVersion',
    'settings',
    'streakState',
    'adaptiveWeights',
    'lastRefreshDate',
    'dailyQuestsIds',
    'completedToday',
    'lastDailyQuestDate',
    'lastFavCategories',
    'dailyBonusGrantedDate',
    'weeklyChallengeWeek',
    'weeklyChallengeQuestId',
    'weeklyChallengeCompletedWeek',
    'lastWarmupCompletedDate',
    'fundamentalsProgress',
    'activeQuestSession',
    'activeSkillPracticeSession',
    'questReviewSchedule',
    'feedbackStats',
    'lastExportAt',
    'activeGoal',
    'completedGoals',
  ],
  quests: [
    'userQuests',
    'deletedQuestIds',
    'questTitleOverrides',
    'completedQuests',
    'questCompletionLogs',
    'microChallengesCompleted',
    'questSavedReferences',
    'questPhaseMedia',
  ],
  skills: ['skillNodes', 'legacySkills', 'achievements'],
  gallery: ['completedWorks'],
  cosmetics: ['portraitProgress'],
}

export function pickProgressChunkFields(
  chunkKey: ProgressChunkKey,
  full: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of PROGRESS_CHUNK_FIELD_MAP[chunkKey]) {
    if (field in full) out[field] = full[field]
  }
  return out
}

export function splitProgressSnapshot(
  full: Record<string, unknown>,
): Record<ProgressChunkKey, Record<string, unknown>> {
  const chunks = {} as Record<ProgressChunkKey, Record<string, unknown>>
  for (const key of PROGRESS_CHUNK_KEYS) {
    chunks[key] = pickProgressChunkFields(key, full)
  }
  return chunks
}

export function collectAllChunkFieldKeys(): Set<string> {
  const keys = new Set<string>()
  for (const chunkKey of PROGRESS_CHUNK_KEYS) {
    for (const field of PROGRESS_CHUNK_FIELD_MAP[chunkKey]) {
      if (field === 'schemaVersion') continue
      keys.add(field)
    }
  }
  return keys
}
