import { useUIStore } from '@/store/useUIStore'

/** Accessibility: when enabled, session countdown timers do not tick down. */
export function areSessionTimersDisabled(): boolean {
  return useUIStore.getState().settings.disableSessionTimers === true
}
