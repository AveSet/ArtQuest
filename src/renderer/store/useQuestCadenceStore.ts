import { useQuestStore } from './useQuestStore'
import { pickQuestCadenceSlice } from './questStore/cadenceSlice'

/** Compatibility facade — cadence / dailies slice of quest state. */
export function useQuestCadenceStore<T>(selector: (state: ReturnType<typeof pickQuestCadenceSlice>) => T): T {
  return useQuestStore((state) => selector(pickQuestCadenceSlice(state)))
}

useQuestCadenceStore.getState = () => pickQuestCadenceSlice(useQuestStore.getState())
