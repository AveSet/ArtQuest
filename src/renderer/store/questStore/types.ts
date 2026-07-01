import type { StoreApi } from 'zustand'
import type { QuestState } from '../useQuestStore'

export type QuestStoreSliceCreator<TSlice> = (
  set: StoreApi<QuestState>['setState'],
  get: StoreApi<QuestState>['getState'],
) => TSlice
