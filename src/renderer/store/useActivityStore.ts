import { create } from 'zustand'

export type ActivityState = {
  processName: string
  idleSec: number
  artAppActive: boolean
  userActive: boolean
  shouldCountTime: boolean
}

type ActivityStore = ActivityState & {
  update: (patch: Partial<ActivityState>) => void
}

const DEFAULT: ActivityState = {
  processName: '',
  idleSec: 0,
  artAppActive: false,
  userActive: false,
  shouldCountTime: false,
}

export const useActivityStore = create<ActivityStore>((set) => ({
  ...DEFAULT,
  update: (patch) => set((s) => ({ ...s, ...patch })),
}))

export function shouldCountSessionTime(): boolean {
  return useActivityStore.getState().shouldCountTime
}
