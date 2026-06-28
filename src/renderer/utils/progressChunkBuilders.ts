import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { CURRENT_PROGRESS_SCHEMA_VERSION } from '../../shared/progressSchema'
import { PROGRESS_CHUNK_KEYS, type ProgressChunkKey } from '../../shared/progressChunkMerge'
import { serializeQuestSession, serializeSkillPracticeSession } from '@/utils/sessionPersistence'
import { serializeQuestTitleOverrides } from '@/utils/questTitleOverrides'
import type { CompletedWork } from '@/store/models'

function sanitizeCompletedWorks(works: CompletedWork[]): CompletedWork[] {
  return (works || [])
    .filter((w) => w && typeof w === 'object')
    .map((w) => {
      try {
        return {
          ...w,
          imageUrl: w.savedPath && w.imageUrl?.startsWith('data:') ? '' : w.imageUrl,
        }
      } catch {
        return {
          questId: w.questId ?? 0,
          imageUrl: '',
          savedPath: undefined,
          date: new Date().toISOString(),
        }
      }
    })
}

function buildCoreChunk(): Record<string, unknown> {
  const questState = useQuestStore.getState()
  const uiState = useUIStore.getState()
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    settings: uiState.settings,
    streakState: uiState.streakState,
    adaptiveWeights: uiState.adaptiveWeights,
    lastRefreshDate: uiState.lastRefreshDate,
    dailyQuestsIds: questState.dailyQuestsIds,
    completedToday: questState.completedToday,
    lastDailyQuestDate: questState.lastDailyQuestDate,
    lastFavCategories: questState.lastFavCategories,
    dailyBonusGrantedDate: questState.dailyBonusGrantedDate,
    weeklyChallengeWeek: questState.weeklyChallengeWeek,
    weeklyChallengeQuestId: questState.weeklyChallengeQuestId,
    weeklyChallengeCompletedWeek: questState.weeklyChallengeCompletedWeek,
    lastWarmupCompletedDate: questState.lastWarmupCompletedDate,
    fundamentalsProgress: questState.fundamentalsProgress,
    activeQuestSession: serializeQuestSession(useQuestSessionStore.getState().session),
    activeSkillPracticeSession: serializeSkillPracticeSession(
      useSkillPracticeStore.getState().session,
    ),
    questReviewSchedule: uiState.questReviewSchedule,
    feedbackStats: uiState.feedbackStats,
    lastExportAt: uiState.lastExportAt,
    activeGoal: uiState.activeGoal,
    completedGoals: uiState.completedGoals,
  }
}

function buildQuestsChunk(): Record<string, unknown> {
  const questState = useQuestStore.getState()
  return {
    userQuests: questState.userQuests,
    deletedQuestIds: questState.deletedQuestIds,
    questTitleOverrides: serializeQuestTitleOverrides(questState.questTitleOverrides),
    completedQuests: questState.completedQuests,
    questCompletionLogs: questState.questCompletionLogs,
    microChallengesCompleted: questState.microChallengesCompleted,
    questSavedReferences: questState.questSavedReferences,
    questPhaseMedia: questState.questPhaseMedia,
  }
}

function buildSkillsChunk(): Record<string, unknown> {
  const skillState = useSkillStore.getState()
  return {
    skillNodes: skillState.skillNodes,
    legacySkills: skillState.legacySkills,
    achievements: skillState.achievements,
  }
}

function buildGalleryChunk(): Record<string, unknown> {
  return {
    completedWorks: sanitizeCompletedWorks(useQuestStore.getState().completedWorks),
  }
}

function buildCosmeticsChunk(): Record<string, unknown> {
  const portrait = usePortraitStore.getState()
  return {
    portraitProgress: {
      dailyChestStreak: portrait.dailyChestStreak,
      lastDailyChestProgressDate: portrait.lastDailyChestProgressDate,
      streakShieldUsedMonth: portrait.streakShieldUsedMonth,
      lastShieldUsedOnDate: portrait.lastShieldUsedOnDate,
    },
  }
}

const CHUNK_BUILDERS: Record<ProgressChunkKey, () => Record<string, unknown>> = {
  core: buildCoreChunk,
  quests: buildQuestsChunk,
  skills: buildSkillsChunk,
  gallery: buildGalleryChunk,
  cosmetics: buildCosmeticsChunk,
}

/** Build one save chunk from live stores — avoids full buildProgressData() on incremental saves. */
export function buildProgressChunkFromStores(chunk: ProgressChunkKey): Record<string, unknown> {
  return CHUNK_BUILDERS[chunk]()
}

/** Merge all chunk builders into a single raw payload (schema parse happens in buildProgressData). */
export function buildProgressPayloadFromStores(): Record<string, unknown> {
  return PROGRESS_CHUNK_KEYS.reduce<Record<string, unknown>>(
    (acc, key) => ({ ...acc, ...buildProgressChunkFromStores(key) }),
    {},
  )
}
