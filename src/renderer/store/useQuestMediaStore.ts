import { useQuestStore } from './useQuestStore'
import { pickQuestMediaSlice } from './questStore/mediaSlice'

/** Compatibility facade — saved references / phase media slice. */
export function useQuestMediaStore<T>(selector: (state: ReturnType<typeof pickQuestMediaSlice>) => T): T {
  return useQuestStore((state) => selector(pickQuestMediaSlice(state)))
}

useQuestMediaStore.getState = () => pickQuestMediaSlice(useQuestStore.getState())
