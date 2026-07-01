import type { QuestPhaseMediaEntry, QuestSavedReference } from '../models'
import { readFileAsDataURL } from '@/utils/fileHelpers'
import { getPhaseMediaStorageId } from '@/utils/questPhaseKeys'
import {
  getPhaseMediaEntries,
  newPhaseMediaId,
  type QuestPhaseMediaMap,
} from '@/utils/questPhaseMedia'
import type { QuestStoreSliceCreator } from './types'

export type QuestMediaSlice = {
  questSavedReferences: Record<string, QuestSavedReference[]>
  questPhaseMedia: QuestPhaseMediaMap
  getQuestReferences: (questId: number) => QuestSavedReference[]
  addQuestReferenceFromFile: (questId: number, file: File) => Promise<boolean>
  removeQuestReference: (questId: number, refId: string) => Promise<void>
  getPhaseMediaEntries: (questId: number, phaseKey: string) => QuestPhaseMediaEntry[]
  appendPhaseMediaFromFile: (questId: number, phaseKey: string, file: File) => Promise<boolean>
  removePhaseMediaEntry: (questId: number, phaseKey: string, index: number) => Promise<void>
}

export const questMediaInitialState: Pick<QuestMediaSlice, 'questSavedReferences' | 'questPhaseMedia'> = {
  questSavedReferences: {},
  questPhaseMedia: {},
}

export const createQuestMediaSlice: QuestStoreSliceCreator<QuestMediaSlice> = (set, get) => ({
  ...questMediaInitialState,
  getQuestReferences: (questId) => get().questSavedReferences[String(questId)] ?? [],
  addQuestReferenceFromFile: async (questId, file) => {
    if (!file.type.startsWith('image/')) return false
    const api = window.electronAPI
    if (!api?.gallery?.saveQuestReference) return false
    try {
      const base64 = await readFileAsDataURL(file)
      const result = await api.gallery.saveQuestReference(base64, String(questId))
      if (!result.success || !result.path || !result.id) return false
      const entry: QuestSavedReference = {
        id: result.id,
        path: result.path,
        addedAt: new Date().toISOString(),
      }
      set((state) => {
        const key = String(questId)
        const prev = state.questSavedReferences[key] ?? []
        return {
          questSavedReferences: {
            ...state.questSavedReferences,
            [key]: [...prev, entry],
          },
        }
      })
      return true
    } catch {
      return false
    }
  },
  removeQuestReference: async (questId, refId) => {
    const key = String(questId)
    const list = get().questSavedReferences[key] ?? []
    const ref = list.find((r) => r.id === refId)
    if (ref?.path) {
      await window.electronAPI?.gallery?.deleteQuestReference?.(ref.path)
    }
    set((state) => ({
      questSavedReferences: {
        ...state.questSavedReferences,
        [key]: (state.questSavedReferences[key] ?? []).filter((r) => r.id !== refId),
      },
    }))
  },
  getPhaseMediaEntries: (questId, phaseKey) =>
    getPhaseMediaEntries(get().questPhaseMedia, questId, phaseKey),
  appendPhaseMediaFromFile: async (questId, phaseKey, file) => {
    if (!file.type.startsWith('image/')) return false
    const questKey = String(questId)
    const entryId = newPhaseMediaId()
    const api = window.electronAPI
    let entry: QuestPhaseMediaEntry

    if (api?.gallery?.saveQuestReference) {
      try {
        const base64 = await readFileAsDataURL(file)
        const storageId = getPhaseMediaStorageId(questId, phaseKey, entryId)
        const result = await api.gallery.saveQuestReference(base64, storageId)
        if (!result.success || !result.path) return false
        entry = {
          id: entryId,
          path: result.path,
          mimeType: file.type,
          addedAt: new Date().toISOString(),
        }
      } catch {
        return false
      }
    } else {
      try {
        const dataUrl = await readFileAsDataURL(file)
        entry = {
          id: entryId,
          dataUrl,
          mimeType: file.type,
          addedAt: new Date().toISOString(),
        }
      } catch {
        return false
      }
    }

    set((state) => {
      const prev = state.questPhaseMedia[questKey]?.[phaseKey] ?? []
      return {
        questPhaseMedia: {
          ...state.questPhaseMedia,
          [questKey]: {
            ...(state.questPhaseMedia[questKey] ?? {}),
            [phaseKey]: [...prev, entry],
          },
        },
      }
    })
    return true
  },
  removePhaseMediaEntry: async (questId, phaseKey, index) => {
    const questKey = String(questId)
    const list = get().questPhaseMedia[questKey]?.[phaseKey] ?? []
    const existing = list[index]
    if (!existing) return
    if (existing.path) {
      await window.electronAPI?.gallery?.deleteQuestReference?.(existing.path)
    }
    set((state) => {
      const prevList = state.questPhaseMedia[questKey]?.[phaseKey] ?? []
      const nextList = prevList.filter((_, i) => i !== index)
      const prev = { ...(state.questPhaseMedia[questKey] ?? {}) }
      if (nextList.length === 0) delete prev[phaseKey]
      else prev[phaseKey] = nextList
      const next = { ...state.questPhaseMedia }
      if (Object.keys(prev).length === 0) delete next[questKey]
      else next[questKey] = prev
      return { questPhaseMedia: next }
    })
  },
})

export function pickQuestMediaSlice<T extends QuestMediaSlice>(state: T): QuestMediaSlice {
  return {
    questSavedReferences: state.questSavedReferences,
    questPhaseMedia: state.questPhaseMedia,
    getQuestReferences: state.getQuestReferences,
    addQuestReferenceFromFile: state.addQuestReferenceFromFile,
    removeQuestReference: state.removeQuestReference,
    getPhaseMediaEntries: state.getPhaseMediaEntries,
    appendPhaseMediaFromFile: state.appendPhaseMediaFromFile,
    removePhaseMediaEntry: state.removePhaseMediaEntry,
  }
}
