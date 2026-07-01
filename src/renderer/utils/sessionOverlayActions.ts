import { getI18nFromStore } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { getElectronAPI, isElectronDesktop, openSessionOverlayIpc } from '@/utils/electronBridge'
import { forceSyncSessionOverlayPayload } from '@/utils/sessionOverlaySync'

type FlatOverlayExtras = {
  hideSessionOverlay?: () => Promise<unknown>
  toggleQuestOverlay?: () => Promise<unknown>
  expandQuestOverlay?: () => Promise<unknown>
  cancelQuestOverlay?: () => Promise<unknown>
}

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
  const api = getElectronAPI() as FlatOverlayExtras & {
    overlay?: { hide?: () => Promise<unknown> }
  }
  if (!api) return
  void (api.overlay?.hide ?? api.hideSessionOverlay)?.()
}

/** Toggle between PiP widget and main window (Electron only). */
export function toggleSessionOverlayView(): void {
  const api = getElectronAPI() as FlatOverlayExtras & {
    overlay?: { toggle?: () => Promise<unknown> }
  }
  if (!api) return
  void (api.overlay?.toggle ?? api.toggleQuestOverlay)?.()
}

/** Hide widget and restore main window without ending the session. */
export function expandSessionToMainWindow(): void {
  const api = getElectronAPI() as FlatOverlayExtras & {
    overlay?: { expand?: () => Promise<unknown> }
  }
  if (!api) return
  void (api.overlay?.expand ?? api.expandQuestOverlay)?.()
}

/** Hide widget, restore main window, and end the session from the main renderer. */
export function cancelSessionFromOverlay(): void {
  const api = getElectronAPI() as FlatOverlayExtras & {
    overlay?: { cancel?: () => Promise<unknown> }
  }
  if (!api) return
  void (api.overlay?.cancel ?? api.cancelQuestOverlay)?.()
}
