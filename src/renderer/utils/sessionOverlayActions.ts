import { getI18nFromStore } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { isElectronDesktop, openSessionOverlayIpc } from '@/utils/electronBridge'
import { forceSyncSessionOverlayPayload } from '@/utils/sessionOverlaySync'

/** PiP widget is available in Electron when enabled in settings. */
export function isSessionWidgetModeEnabled(): boolean {
  if (!isElectronDesktop()) return false
  return useUIStore.getState().settings.sessionWidgetMode !== false
}

/** Show session PiP widget and hide the main window (manual collapse only). */
export async function collapseSessionToOverlay(): Promise<void> {
  if (!isElectronDesktop()) return

  const { language, t } = getI18nFromStore()
  const synced = await forceSyncSessionOverlayPayload(language, t)
  if (!synced) return

  await openSessionOverlayIpc({ hideMain: true })
}

/** Hide floating overlay without restoring the main window. */
export function hideSessionOverlay(): void {
  void window.electronAPI?.overlay?.hide?.()
}

/** Toggle between PiP widget and main window (Electron only). */
export function toggleSessionOverlayView(): void {
  void window.electronAPI?.overlay?.toggle?.()
}

/** Hide widget and restore main window without ending the session. */
export function expandSessionToMainWindow(): void {
  void window.electronAPI?.overlay?.expand?.()
}

/** Hide widget, restore main window, and end the session from the main renderer. */
export function cancelSessionFromOverlay(): void {
  void window.electronAPI?.overlay?.cancel?.()
}
