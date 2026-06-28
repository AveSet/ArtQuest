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

export type FrozenStoreSnapshot = {
  quest: ReturnType<typeof useQuestStore.getState>
  ui: ReturnType<typeof useUIStore.getState>
  skill: ReturnType<typeof useSkillStore.getState>
  questSession: ReturnType<typeof useQuestSessionStore.getState>
  skillPractice: ReturnType<typeof useSkillPracticeStore.getState>
  portrait: ReturnType<typeof usePortraitStore.getState>
}

export function captureStoreSnapshot(): FrozenStoreSnapshot {
  return {
    quest: useQuestStore.getState(),
    ui: useUIStore.getState(),
    skill: useSkillStore.getState(),
    questSession: useQuestSessionStore.getState(),
    skillPractice: useSkillPracticeStore.getState(),
    portrait: usePortraitStore.getState(),
  }
}

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

function buildCoreChunkFromSnapshot(snapshot: FrozenStoreSnapshot): Record<string, unknown> {
  const { quest: questState, ui: uiState, questSession, skillPractice } = snapshot
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
    activeQuestSession: serializeQuestSession(questSession.session),
    activeSkillPracticeSession: serializeSkillPracticeSession(skillPractice.session),
    questReviewSchedule: uiState.questReviewSchedule,
    feedbackStats: uiState.feedbackStats,
    lastExportAt: uiState.lastExportAt,
    activeGoal: uiState.activeGoal,
    completedGoals: uiState.completedGoals,
  }
}

function buildQuestsChunkFromSnapshot(snapshot: FrozenStoreSnapshot): Record<string, unknown> {
  const questState = snapshot.quest
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

function buildSkillsChunkFromSnapshot(snapshot: FrozenStoreSnapshot): Record<string, unknown> {
  const skillState = snapshot.skill
  return {
    skillNodes: skillState.skillNodes,
    legacySkills: skillState.legacySkills,
    achievements: skillState.achievements,
  }
}

function buildGalleryChunkFromSnapshot(snapshot: FrozenStoreSnapshot): Record<string, unknown> {
  return {
    completedWorks: sanitizeCompletedWorks(snapshot.quest.completedWorks),
  }
}

function buildCosmeticsChunkFromSnapshot(snapshot: FrozenStoreSnapshot): Record<string, unknown> {
  const portrait = snapshot.portrait
  return {
    portraitProgress: {
      dailyChestStreak: portrait.dailyChestStreak,
      lastDailyChestProgressDate: portrait.lastDailyChestProgressDate,
      streakShieldUsedMonth: portrait.streakShieldUsedMonth,
      lastShieldUsedOnDate: portrait.lastShieldUsedOnDate,
    },
  }
}

const CHUNK_BUILDERS_FROM_SNAPSHOT: Record<
  ProgressChunkKey,
  (snapshot: FrozenStoreSnapshot) => Record<string, unknown>
> = {
  core: buildCoreChunkFromSnapshot,
  quests: buildQuestsChunkFromSnapshot,
  skills: buildSkillsChunkFromSnapshot,
  gallery: buildGalleryChunkFromSnapshot,
  cosmetics: buildCosmeticsChunkFromSnapshot,
}

/** Build one save chunk from a frozen store snapshot (consistent multi-chunk batches). */
export function buildProgressChunkFromSnapshot(
  chunk: ProgressChunkKey,
  snapshot: FrozenStoreSnapshot,
): Record<string, unknown> {
  return CHUNK_BUILDERS_FROM_SNAPSHOT[chunk](snapshot)
}

/** Build one save chunk from live stores — avoids full buildProgressData() on incremental saves. */
export function buildProgressChunkFromStores(chunk: ProgressChunkKey): Record<string, unknown> {
  return buildProgressChunkFromSnapshot(chunk, captureStoreSnapshot())
}

/** Merge all chunk builders into a single raw payload (schema parse happens in buildProgressData). */
export function buildProgressPayloadFromStores(): Record<string, unknown> {
  const snapshot = captureStoreSnapshot()
  return PROGRESS_CHUNK_KEYS.reduce<Record<string, unknown>>(
    (acc, key) => ({ ...acc, ...buildProgressChunkFromSnapshot(key, snapshot) }),
    {},
  )
}
