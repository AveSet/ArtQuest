import { create } from 'zustand'

type SessionRitualState = {
  showPhaseTransition: boolean
  phaseTransitionKey: 'warmup' | 'core' | 'polish' | null
  setActive: () => void
  showPhaseTransitionBanner: (key: 'warmup' | 'core' | 'polish') => void
  hidePhaseTransitionBanner: () => void
  reset: () => void
}

export const useSessionRitualStore = create<SessionRitualState>((set) => ({
  showPhaseTransition: false,
  phaseTransitionKey: null,

  setActive: () => set({}),

  showPhaseTransitionBanner: (key) => set({ showPhaseTransition: true, phaseTransitionKey: key }),

  hidePhaseTransitionBanner: () => set({ showPhaseTransition: false, phaseTransitionKey: null }),

  reset: () =>
    set({
      showPhaseTransition: false,
      phaseTransitionKey: null,
    }),
}))
