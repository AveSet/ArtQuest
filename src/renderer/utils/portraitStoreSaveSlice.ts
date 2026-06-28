import type { usePortraitStore } from '@/store/usePortraitStore'

type PortraitState = ReturnType<typeof usePortraitStore.getState>

/** Persisted portrait fields only — excludes transient UI like pendingChestReveal. */
export function portraitStoreSaveFingerprint(state: PortraitState): string {
  return [
    state.dailyChestStreak,
    state.lastDailyChestProgressDate,
    state.streakShieldUsedMonth,
    state.lastShieldUsedOnDate,
  ].join('|')
}
