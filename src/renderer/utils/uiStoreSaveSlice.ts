import type { useUIStore } from '@/store/useUIStore'

type UIState = ReturnType<typeof useUIStore.getState>

function settingsFingerprint(settings: UIState['settings']): string {
  return [
    settings.soundEnabled,
    settings.soundVolume,
    settings.ambientEnabled,
    settings.ambientVolume,
    settings.language,
    settings.favoriteCategories.join(','),
    settings.useRandomCategories,
    settings.minimizeToTray,
    settings.sessionWidgetMode,
    settings.openAtLogin,
    settings.remindersEnabled,
    settings.reminderHour,
    settings.reminderMinute,
    settings.fontScale,
    settings.contrastBoost,
    settings.reduceMotion,
    settings.hasSeenOnboarding,
    settings.profileSetupComplete,
    settings.theme,
    settings.experienceTier,
    settings.learningProfile,
    settings.portraitGender,
    settings.activityTrackingEnabled,
    (settings.trackedArtApps ?? []).join(','),
    settings.artIdleTimeoutSec ?? '',
    Object.keys(settings.materialEngagement ?? {}).length,
    settings.materialFavoriteIds.length,
    settings.materialCustomLinks.length,
  ].join('|')
}

/** Fingerprint of UI fields that are persisted in the `core` progress chunk. */
export function uiStoreSaveFingerprint(state: UIState): string {
  const streak = state.streakState
  return [
    settingsFingerprint(state.settings),
    streak.current,
    streak.longest,
    streak.lastActiveDate,
    streak.streakRecoveryDueDate ?? '',
    streak.lastDailyRitualDate ?? '',
    streak.streakRecoveryHintShownDate ?? '',
    Object.keys(state.adaptiveWeights).length,
    state.adaptiveWeights.default,
    state.lastRefreshDate,
    Object.keys(state.questReviewSchedule).length,
    Object.keys(state.feedbackStats).length,
    state.lastExportAt ?? '',
    state.activeGoal?.text ?? '',
    state.activeGoal?.createdAt ?? '',
    state.completedGoals.length,
    state.completedGoals[0]?.id ?? '',
  ].join('|')
}
