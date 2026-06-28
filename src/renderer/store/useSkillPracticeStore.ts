import { create } from 'zustand'
import type { QuestCategory } from '@/data/skillTree'
import { expandSessionToMainWindow } from '@/utils/sessionOverlayActions'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import {
  onSkillPracticeSecondTick,
  resetStretchReminder,
  syncStretchBucketFromElapsed,
} from '@/utils/skillPracticeStretchReminder'

type SkillPracticeSession = {
  nodeId: string
  category: QuestCategory
  startedAtMs: number
  activeElapsedSec: number
}

interface SkillPracticeState {
  session: SkillPracticeSession | null
  /** When true, full node panel is hidden but timer keeps running (navbar widget visible on Skills). */
  panelMinimized: boolean
  startSession: (nodeId: string, category: QuestCategory) => void
  hydrateSession: (session: SkillPracticeSession | null, panelMinimized?: boolean) => void
  setPanelMinimized: (minimized: boolean) => void
  tickActiveSecond: () => void
  clearSession: () => void
}

export const useSkillPracticeStore = create<SkillPracticeState>((set, get) => ({
  session: null,
  panelMinimized: false,
  startSession: (nodeId, category) => {
    useQuestSessionStore.getState().cancelSession()
    set({ session: { nodeId, category, startedAtMs: Date.now(), activeElapsedSec: 0 }, panelMinimized: false })
  },
  hydrateSession: (session, panelMinimized = false) => {
    if (session) {
      syncStretchBucketFromElapsed(session.activeElapsedSec ?? 0)
    } else {
      resetStretchReminder()
    }
    set({
      session: session
        ? { ...session, activeElapsedSec: session.activeElapsedSec ?? 0 }
        : null,
      panelMinimized: session ? panelMinimized : false,
    })
    if (session) expandSessionToMainWindow()
  },
  setPanelMinimized: (minimized) => set({ panelMinimized: minimized }),
  tickActiveSecond: () => {
    const { session } = get()
    if (!session) return
    const nextSec = session.activeElapsedSec + 1
    set({ session: { ...session, activeElapsedSec: nextSec } })
    onSkillPracticeSecondTick(nextSec)
  },
  clearSession: () => {
    resetStretchReminder()
    set({ session: null, panelMinimized: false })
  },
}))

export type { SkillPracticeSession }
