import { getI18nFromStore } from '@/i18n'
import { forceSyncSessionOverlayPayload } from '@/utils/sessionOverlaySync'

export function isSessionWidgetModeEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI)
}

/** Show session PiP widget and hide the main window (manual collapse only). */
export async function collapseSessionToOverlay(): Promise<void> {
  const api = window.electronAPI
  if (!api?.openSessionOverlay) return

  const { language, t } = getI18nFromStore()
  const synced = await forceSyncSessionOverlayPayload(language, t)
  if (!synced) return

  await api.openSessionOverlay({ hideMain: true })
}

/** Hide floating overlay without restoring the main window. */
export function hideSessionOverlay(): void {
  void window.electronAPI?.hideSessionOverlay?.()
}

/** Toggle between PiP widget and main window (Electron only). */
export function toggleSessionOverlayView(): void {
  void window.electronAPI?.toggleQuestOverlay?.()
}

/** Hide widget and restore main window without ending the session. */
export function expandSessionToMainWindow(): void {
  void window.electronAPI?.expandQuestOverlay?.()
}

/** Hide widget, restore main window, and end the session from the main renderer. */
export function cancelSessionFromOverlay(): void {
  void window.electronAPI?.cancelQuestOverlay?.()
}
