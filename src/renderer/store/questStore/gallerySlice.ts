import type { CompletedWork } from '../models'
import type { QuestStoreSliceCreator } from './types'

export type QuestGallerySlice = {
  completedWorks: CompletedWork[]
  uploadWork: (
    questId: number,
    imageUrl: string,
    savedPath?: string,
    notes?: string,
    mediaType?: 'image' | 'video',
    meta?: Partial<CompletedWork>,
  ) => void
  toggleWorkFavorite: (workKey: { id?: string; questId: number; date: string }) => void
  updateWorkReview: (
    workKey: { id?: string; questId: number; date: string },
    patch: { notes?: string; improvementNotes?: string; tags?: string[] },
  ) => void
}

export const questGalleryInitialState: Pick<QuestGallerySlice, 'completedWorks'> = {
  completedWorks: [],
}

export const createQuestGallerySlice: QuestStoreSliceCreator<QuestGallerySlice> = (set) => ({
  ...questGalleryInitialState,
  uploadWork: (questId, imageUrl, savedPath, notes, mediaType, meta) => {
    set((state) => ({
      completedWorks: [
        ...state.completedWorks,
        {
          ...meta,
          questId,
          imageUrl,
          savedPath,
          date: new Date().toISOString(),
          notes: notes?.trim() || undefined,
          mediaType,
        },
      ],
    }))
  },
  toggleWorkFavorite: (workKey) => {
    set((state) => ({
      completedWorks: state.completedWorks.map((work) => {
        const sameId = workKey.id && work.id === workKey.id
        const sameFallback = !workKey.id && work.questId === workKey.questId && work.date === workKey.date
        if (!sameId && !sameFallback) return work
        return { ...work, favorite: !work.favorite }
      }),
    }))
  },
  updateWorkReview: (workKey, patch) => {
    set((state) => ({
      completedWorks: state.completedWorks.map((work) => {
        const sameId = workKey.id && work.id === workKey.id
        const sameFallback = !workKey.id && work.questId === workKey.questId && work.date === workKey.date
        if (!sameId && !sameFallback) return work
        return {
          ...work,
          ...(patch.notes !== undefined ? { notes: patch.notes.trim() || undefined } : {}),
          ...(patch.improvementNotes !== undefined
            ? { improvementNotes: patch.improvementNotes.trim() || undefined }
            : {}),
          ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        }
      }),
    }))
  },
})

export function pickQuestGallerySlice<T extends QuestGallerySlice>(state: T): QuestGallerySlice {
  return {
    completedWorks: state.completedWorks,
    uploadWork: state.uploadWork,
    toggleWorkFavorite: state.toggleWorkFavorite,
    updateWorkReview: state.updateWorkReview,
  }
}
