import { useQuestStore } from './useQuestStore'
import { pickQuestGallerySlice } from './questStore/gallerySlice'

/** Compatibility facade — gallery slice of quest state. */
export function useQuestGalleryStore<T>(selector: (state: ReturnType<typeof pickQuestGallerySlice>) => T): T {
  return useQuestStore((state) => selector(pickQuestGallerySlice(state)))
}

useQuestGalleryStore.getState = () => pickQuestGallerySlice(useQuestStore.getState())
