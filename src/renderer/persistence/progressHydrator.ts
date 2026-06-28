import type { ProgressPayload } from '../../shared/progressSchema'
import type { Quest, Achievement, CompletedWork, Settings } from '@/store/models'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore, createInitialSkillNodes } from '@/store/useSkillStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { useThemeStore } from '@/store/useThemeStore'
import { applyPrerequisiteUnlocks } from '@/utils/skillUnlocks'
import { mergeQuestLists } from '@/utils/mergeQuestLists'
import { normalizeQuestTitleOverrides } from '@/utils/questTitleOverrides'
import { normalizeQuestSessionShortcuts } from '../../shared/questSessionShortcuts'
import { expectedMaxXpAtNodeLevel, NODE_MAX_LEVEL } from '@/utils/progressionBalance'
import { getLocalDateStr, reconcileCompletedToday } from '@/utils/dailyQuests'
import { normalizeFundamentalsProgress } from '@/utils/fundamentalsProgress'
import { normalizeQuestPhaseMedia } from '@/utils/questPhaseMedia'
import {
  restoreQuestSession,
  restoreSkillPracticeSession,
} from '@/utils/sessionPersistence'

export type SavedGalleryImage = {
  id?: string
  filename: string
  path: string
  questId: number | null
  date: string
  mediaType?: 'image' | 'video'
  thumbnailPath?: string
  storageMode?: 'local' | 'local_and_cloud' | 'cloud_only' | 'google_drive'
  cloudProvider?: string
  remoteFileId?: string
  remotePath?: string
  syncStatus?: string
  syncError?: string
  lastSyncAt?: string
}

export type HydratedUiSlice = {
  settings: Settings
  streakState: ProgressPayload['streakState']
  adaptiveWeights: ProgressPayload['adaptiveWeights']
  lastRefreshDate: string
  questReviewSchedule: ProgressPayload['questReviewSchedule']
  feedbackStats: ProgressPayload['feedbackStats']
  lastExportAt: string | undefined
  activeGoal: ProgressPayload['activeGoal']
  completedGoals: ProgressPayload['completedGoals']
}

function mergeGalleryWorks(
  dataWorks: CompletedWork[],
  savedImages: SavedGalleryImage[],
): CompletedWork[] {
  const completedWorks: CompletedWork[] = dataWorks.map((w) => ({
    ...w,
    imageUrl: w.imageUrl?.startsWith('data:') ? w.imageUrl : '',
  }))

  for (const img of savedImages) {
    if (img.questId == null) continue
    const existingIdx = completedWorks.findIndex(
      (w) =>
        (img.id && w.id === img.id) ||
        (w.questId === img.questId && (w.savedPath === img.path || w.imageUrl?.startsWith('data:'))),
    )
    if (existingIdx >= 0) {
      const existing = completedWorks[existingIdx]!
      completedWorks[existingIdx] = {
        ...existing,
        id: img.id ?? existing.id,
        savedPath: img.path || existing.savedPath,
        thumbnailPath: img.thumbnailPath ?? existing.thumbnailPath,
        storageMode: img.storageMode ?? existing.storageMode,
        cloudProvider: img.cloudProvider === 'google' ? ('google' as const) : existing.cloudProvider,
        remoteFileId: img.remoteFileId ?? existing.remoteFileId,
        remotePath: img.remotePath ?? existing.remotePath,
        syncStatus: img.syncStatus ?? existing.syncStatus,
        lastSyncAt: img.lastSyncAt ?? existing.lastSyncAt,
        syncError: img.syncError ?? existing.syncError,
      }
      continue
    }
    completedWorks.push({
      id: img.id,
      questId: img.questId,
      imageUrl: '',
      savedPath: img.path,
      thumbnailPath: img.thumbnailPath,
      date: img.date,
      mediaType: img.mediaType,
      storageMode: img.storageMode,
      cloudProvider: img.cloudProvider === 'google' ? ('google' as const) : undefined,
      remoteFileId: img.remoteFileId,
      remotePath: img.remotePath,
      syncStatus: img.syncStatus,
      lastSyncAt: img.lastSyncAt,
      syncError: img.syncError,
    })
  }

  return completedWorks
}

/** Hydrate quest/skill/session/portrait stores from normalized progress payload. */
export function hydrateStoresFromProgress(
  data: ProgressPayload,
  savedImages: SavedGalleryImage[] = [],
): HydratedUiSlice {
  const savedMap = new Map(data.skillNodes.map((n) => [n.id, n]))
  const freshNodes = createInitialSkillNodes()
  const merged = freshNodes.map((fresh) => {
    const saved = savedMap.get(fresh.id)
    return saved
      ? {
          ...fresh,
          level: Math.min(saved.level, NODE_MAX_LEVEL),
          xp: saved.xp ?? 0,
          prestige: saved.prestige ?? 0,
          maxXp: Math.max(saved.maxXp, expectedMaxXpAtNodeLevel(saved.level)),
          lastReviewDate: saved.lastReviewDate ?? null,
          reviewIntervalDays: saved.reviewIntervalDays ?? fresh.reviewIntervalDays,
          tags: saved.tags ?? fresh.tags,
        }
      : fresh
  })

  useSkillStore.setState({
    skillNodes: applyPrerequisiteUnlocks(merged),
    legacySkills:
      data.legacySkills.length > 0 ? data.legacySkills : useSkillStore.getState().legacySkills,
    achievements:
      data.achievements.length > 0
        ? (data.achievements as Achievement[])
        : useSkillStore.getState().achievements,
  })

  const userQuests = Array.isArray(data.userQuests) ? (data.userQuests as Quest[]) : []
  const deletedQuestIds = Array.isArray(data.deletedQuestIds)
    ? data.deletedQuestIds.filter((id): id is number => typeof id === 'number')
    : []
  const questTitleOverrides = normalizeQuestTitleOverrides(data.questTitleOverrides)
  const questPatch: Partial<ReturnType<typeof useQuestStore.getState>> = {
    userQuests,
    deletedQuestIds,
    questTitleOverrides,
  }
  if (useQuestStore.getState().catalogQuests.length > 0) {
    questPatch.quests = mergeQuestLists(
      useQuestStore.getState().catalogQuests,
      userQuests,
      deletedQuestIds,
    )
  }
  useQuestStore.setState(questPatch)

  if (data.completedQuests.length > 0) {
    const catalog = useQuestStore.getState().catalogQuests
    let completedQuests = data.completedQuests
    if (catalog.length > 0) {
      const repeatableIds = new Set(
        catalog.filter((quest) => quest.is_repeatable).map((quest) => quest.id),
      )
      completedQuests = completedQuests.filter((id) => !repeatableIds.has(id))
    }
    useQuestStore.setState({ completedQuests })
  }

  const completedWorks = mergeGalleryWorks(data.completedWorks, savedImages)
  if (completedWorks.length > 0) {
    useQuestStore.setState({ completedWorks })
  }
  if (data.questCompletionLogs.length > 0) {
    useQuestStore.setState({ questCompletionLogs: data.questCompletionLogs })
  }

  const today = getLocalDateStr()
  const reconciledCompletedToday = reconcileCompletedToday(
    data.completedToday,
    data.dailyQuestsIds,
    data.lastDailyQuestDate,
    today,
  )

  useQuestStore.setState({
    dailyQuestsIds: data.dailyQuestsIds,
    completedToday: reconciledCompletedToday,
    lastDailyQuestDate: data.lastDailyQuestDate,
    lastFavCategories: data.lastFavCategories,
    dailyBonusGrantedDate: data.dailyBonusGrantedDate,
    weeklyChallengeWeek: data.weeklyChallengeWeek,
    weeklyChallengeQuestId: data.weeklyChallengeQuestId,
    weeklyChallengeCompletedWeek: data.weeklyChallengeCompletedWeek,
    lastWarmupCompletedDate: data.lastWarmupCompletedDate ?? '',
    fundamentalsProgress: normalizeFundamentalsProgress(data.fundamentalsProgress),
    microChallengesCompleted: data.microChallengesCompleted ?? {},
    questSavedReferences: data.questSavedReferences ?? {},
    questPhaseMedia: normalizeQuestPhaseMedia(data.questPhaseMedia),
  })

  const profileSetupComplete =
    typeof data.settings.profileSetupComplete === 'boolean'
      ? data.settings.profileSetupComplete
      : true

  const mergedSettings: Settings = {
    ...data.settings,
    theme: data.settings.theme ?? 'light',
    portraitGender: data.settings.portraitGender ?? 'male',
    profileSetupComplete,
    hasSeenOnboarding:
      typeof data.settings.hasSeenOnboarding === 'boolean'
        ? data.settings.hasSeenOnboarding
        : !profileSetupComplete,
    questSessionShortcuts: normalizeQuestSessionShortcuts(data.settings.questSessionShortcuts),
    sessionWidgetMode: data.settings.sessionWidgetMode !== false,
  }

  useThemeStore.getState().syncFromSettings(mergedSettings.theme)
  useQuestSessionStore.getState().hydrateSession(restoreQuestSession(data.activeQuestSession))
  useSkillPracticeStore
    .getState()
    .hydrateSession(restoreSkillPracticeSession(data.activeSkillPracticeSession), false)
  usePortraitStore.getState().hydratePortrait(data.portraitProgress)

  return {
    settings: mergedSettings,
    streakState: data.streakState,
    adaptiveWeights: data.adaptiveWeights,
    lastRefreshDate: data.lastRefreshDate,
    questReviewSchedule: data.questReviewSchedule ?? {},
    feedbackStats: data.feedbackStats ?? {},
    lastExportAt: data.lastExportAt,
    activeGoal: data.activeGoal ?? null,
    completedGoals: data.completedGoals ?? [],
  }
}

/** Restore gallery-only metadata when no progress JSON exists. */
export function hydrateGalleryOnlyFromDisk(savedImages: SavedGalleryImage[]): void {
  const completedWorks = savedImages
    .filter((img) => img.questId != null)
    .map((img) => ({
      id: img.id,
      questId: img.questId!,
      imageUrl: '',
      savedPath: img.path,
      date: img.date,
      mediaType: img.mediaType,
      storageMode: img.storageMode,
      cloudProvider: img.cloudProvider === 'google' ? ('google' as const) : undefined,
      remoteFileId: img.remoteFileId,
      remotePath: img.remotePath,
      syncStatus: img.syncStatus,
      lastSyncAt: img.lastSyncAt,
    }))
  if (completedWorks.length > 0) {
    useQuestStore.setState({ completedWorks })
  }
}
