import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import type { CompletedWork } from '@/store/models'

function mediaPathKey(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase()
}

function savedImageToWork(img: {
  id?: string
  path: string
  questId: number
  date: string
  mediaType?: 'image' | 'video'
  thumbnailPath?: string
  storageMode?: CompletedWork['storageMode']
  cloudProvider?: string
  remoteFileId?: string
  remotePath?: string
  syncStatus?: string
  syncError?: string
  lastSyncAt?: string
}): CompletedWork {
  return {
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
  }
}

/** Merge disk gallery metadata into quest store; import missing works for gallery display. */
export async function refreshGallerySyncFromDisk(options?: { persist?: boolean }): Promise<boolean> {
  if (!window.electronAPI?.getSavedImages) return false

  const savedImages = await window.electronAPI.getSavedImages()
  if (savedImages.length === 0) return false

  const works = useQuestStore.getState().completedWorks
  let changed = false
  const nextWorks = [...works]

  for (const img of savedImages) {
    if (img.questId == null) continue

    const existingIdx = nextWorks.findIndex(
      (work) =>
        (img.id && work.id === img.id) ||
        (work.questId === img.questId &&
          work.savedPath &&
          mediaPathKey(work.savedPath) === mediaPathKey(img.path)),
    )

    if (existingIdx >= 0) {
      const existing = nextWorks[existingIdx]!
      const syncStatus = img.syncStatus ?? existing.syncStatus
      const storageMode = img.storageMode ?? existing.storageMode
      const savedPath = img.path || existing.savedPath
      const thumbnailPath = img.thumbnailPath ?? existing.thumbnailPath
      if (
        syncStatus === existing.syncStatus &&
        storageMode === existing.storageMode &&
        savedPath === existing.savedPath &&
        thumbnailPath === existing.thumbnailPath &&
        img.remoteFileId === existing.remoteFileId &&
        (img.syncError ?? existing.syncError) === existing.syncError
      ) {
        continue
      }
      changed = true
      nextWorks[existingIdx] = {
        ...existing,
        id: img.id ?? existing.id,
        savedPath,
        thumbnailPath,
        storageMode,
        cloudProvider: img.cloudProvider === 'google' ? ('google' as const) : existing.cloudProvider,
        remoteFileId: img.remoteFileId ?? existing.remoteFileId,
        remotePath: img.remotePath ?? existing.remotePath,
        syncStatus,
        lastSyncAt: img.lastSyncAt ?? existing.lastSyncAt,
        syncError: img.syncError ?? existing.syncError,
        mediaType: img.mediaType ?? existing.mediaType,
        date: img.date || existing.date,
      }
      continue
    }

    changed = true
    nextWorks.push(savedImageToWork({ ...img, questId: img.questId }))
  }

  if (changed) {
    useQuestStore.setState({ completedWorks: nextWorks })
    if (options?.persist !== false) {
      void useUIStore.getState().saveProgress()
    }
  }

  return changed
}
