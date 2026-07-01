import type { ProgressPayload } from '../../../shared/progressSchema'
import type { Quest, CompletedWork } from '../models'
import { useQuestStore } from '../useQuestStore'
import { mergeQuestLists } from '@/utils/mergeQuestLists'
import { normalizeQuestTitleOverrides } from '@/utils/questTitleOverrides'
import { getLocalDateStr, reconcileCompletedToday } from '@/utils/dailyQuests'
import { normalizeFundamentalsProgress } from '@/utils/fundamentalsProgress'
import { normalizeQuestPhaseMedia } from '@/utils/questPhaseMedia'

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

export function hydrateQuestCatalogFromProgress(
  data: ProgressPayload,
): void {
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
}

export function hydrateQuestProgressFromProgress(data: ProgressPayload): void {
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
  if (data.questCompletionLogs.length > 0) {
    useQuestStore.setState({ questCompletionLogs: data.questCompletionLogs })
  }
}

export function hydrateQuestGalleryFromProgress(
  dataWorks: CompletedWork[],
  savedImages: SavedGalleryImage[],
  mergeGalleryWorks: (works: CompletedWork[], images: SavedGalleryImage[]) => CompletedWork[],
): void {
  const completedWorks = mergeGalleryWorks(dataWorks, savedImages)
  if (completedWorks.length > 0) {
    useQuestStore.setState({ completedWorks })
  }
}

export function hydrateQuestCadenceFromProgress(data: ProgressPayload): void {
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
  })
}

export function hydrateQuestMediaFromProgress(data: ProgressPayload): void {
  useQuestStore.setState({
    questSavedReferences: data.questSavedReferences ?? {},
    questPhaseMedia: normalizeQuestPhaseMedia(data.questPhaseMedia),
  })
}

/** Restore all quest-owned slices from a normalized progress payload. */
export function hydrateQuestStores(
  data: ProgressPayload,
  savedImages: SavedGalleryImage[],
  mergeGalleryWorks: (works: CompletedWork[], images: SavedGalleryImage[]) => CompletedWork[],
): void {
  hydrateQuestCatalogFromProgress(data)
  hydrateQuestProgressFromProgress(data)
  hydrateQuestGalleryFromProgress(data.completedWorks, savedImages, mergeGalleryWorks)
  hydrateQuestCadenceFromProgress(data)
  hydrateQuestMediaFromProgress(data)
}

export function resetQuestStores(catalogQuests: Quest[]): void {
  useQuestStore.setState({
    userQuests: [],
    deletedQuestIds: [],
    questTitleOverrides: {},
    catalogQuests,
    quests: catalogQuests,
    completedQuests: [],
    completedWorks: [],
    questCompletionLogs: [],
    dailyQuestsIds: [],
    completedToday: [],
    lastDailyQuestDate: '',
    lastFavCategories: '',
    dailyBonusGrantedDate: '',
    weeklyChallengeWeek: '',
    weeklyChallengeQuestId: 0,
    weeklyChallengeCompletedWeek: '',
    lastWarmupCompletedDate: '',
    fundamentalsProgress: { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' },
    lastCompletionReward: null,
    microChallengesCompleted: {},
    questSavedReferences: {},
    questPhaseMedia: {},
  })
}
