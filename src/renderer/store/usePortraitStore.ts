import { create } from 'zustand'
import { advanceDailyChestProgress, type DailyChestProgressInput } from '@/utils/portraitChestProgress'
import { playSound, playSessionSound } from '@/utils/sound'
import { getLocalDateStr, calendarDaysBetween } from '@/utils/dailyQuests'
import { isStreakShieldAvailable as canUseStreakShield, monthKeyFromDate } from '@/utils/streakShield'

export type PortraitProgress = DailyChestProgressInput & {
  streakShieldUsedMonth: string
  lastShieldUsedOnDate: string
}

type PortraitState = PortraitProgress & {
  pendingChestReveal: boolean
  recordAllDailiesComplete: (today: string, options?: { useStreakShield?: boolean }) => void
  hydratePortrait: (partial: Partial<PortraitProgress> | null | undefined) => void
  resetPortrait: () => void
  isStreakShieldAvailable: (today?: string) => boolean
  consumeStreakShield: (today?: string) => void
  tryConsumeShieldForMissedDay: (today?: string) => boolean
  clearPendingChestReveal: () => void
}

export const DEFAULT_PORTRAIT_PROGRESS: PortraitProgress = {
  dailyChestStreak: 0,
  lastDailyChestProgressDate: '',
  streakShieldUsedMonth: '',
  lastShieldUsedOnDate: '',
}

export const usePortraitStore = create<PortraitState>((set, get) => ({
  ...DEFAULT_PORTRAIT_PROGRESS,
  pendingChestReveal: false,

  recordAllDailiesComplete: (today, options) => {
    const state = get()
    const next = advanceDailyChestProgress(state, today, {
      useStreakShield: Boolean(options?.useStreakShield),
    })
    set({
      dailyChestStreak: next.dailyChestStreak,
      lastDailyChestProgressDate: next.lastDailyChestProgressDate,
      ...(next.streakCycleComplete ? { streakShieldUsedMonth: 'earned' } : {}),
      pendingChestReveal: next.streakCycleComplete,
    })
    if (next.streakCycleComplete) {
      playSessionSound('chestReveal')
      playSound('dailyComplete')
    }
  },

  hydratePortrait: (partial) => {
    if (!partial) {
      set({ ...DEFAULT_PORTRAIT_PROGRESS })
      return
    }
    set({
      dailyChestStreak: typeof partial.dailyChestStreak === 'number' ? partial.dailyChestStreak : 0,
      lastDailyChestProgressDate:
        typeof partial.lastDailyChestProgressDate === 'string' ? partial.lastDailyChestProgressDate : '',
      streakShieldUsedMonth:
        typeof partial.streakShieldUsedMonth === 'string' ? partial.streakShieldUsedMonth : '',
      lastShieldUsedOnDate:
        typeof partial.lastShieldUsedOnDate === 'string' ? partial.lastShieldUsedOnDate : '',
    })
  },

  resetPortrait: () => set({ ...DEFAULT_PORTRAIT_PROGRESS, pendingChestReveal: false }),

  clearPendingChestReveal: () => set({ pendingChestReveal: false }),

  isStreakShieldAvailable: (today = getLocalDateStr()) =>
    canUseStreakShield(get().streakShieldUsedMonth, today),

  consumeStreakShield: (today = getLocalDateStr()) => {
    set({ streakShieldUsedMonth: monthKeyFromDate(today), lastShieldUsedOnDate: today })
  },

  tryConsumeShieldForMissedDay: (today = getLocalDateStr()) => {
    const state = get()
    if (!state.lastDailyChestProgressDate) return false
    const gap = calendarDaysBetween(state.lastDailyChestProgressDate, today)
    if (gap === 2 && get().isStreakShieldAvailable(today)) {
      get().consumeStreakShield(today)
      return true
    }
    return false
  },
}))
