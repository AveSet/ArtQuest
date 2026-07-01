import { invokeIpc, onChannel } from '../ipcHelpers'

export function createDesktopApi() {
  const syncDesktopSettings = async (payload: Record<string, unknown>): Promise<void> => {
    try {
      await invokeIpc('sync-desktop-settings', payload)
    } catch (err) {
      console.warn('syncDesktopSettings:', err)
    }
  }

  const pickArtAppExecutable = async (): Promise<{
    success: boolean
    path?: string
    canceled?: boolean
    error?: unknown
  }> =>
    (await invokeIpc('pick-art-app-exe')) as {
      success: boolean
      path?: string
      canceled?: boolean
      error?: unknown
    }

  const showTestNotification = async (payload: {
    title: string
    body: string
  }): Promise<{ success: boolean }> =>
    (await invokeIpc('show-test-notification', payload)) as { success: boolean }

  const setTaskbarProgress = (payload: {
    progress: number
    mode?: 'normal' | 'paused' | 'error' | 'none' | 'indeterminate'
  }): Promise<{ success: boolean; error?: unknown }> =>
    invokeIpc('artquest:v1:taskbar:set-progress', payload) as Promise<{
      success: boolean
      error?: unknown
    }>

  const applyWindowBounds = (bounds: {
    main?: { x: number; y: number; width: number; height: number }
    overlay?: { x: number; y: number }
    reference?: { x: number; y: number; width: number; height: number }
  }): Promise<{ success: boolean; error?: unknown }> =>
    invokeIpc('artquest:v1:window-bounds:apply', bounds) as Promise<{
      success: boolean
      error?: unknown
    }>

  const onWindowBoundsReport = (
    handler: (bounds: {
      main?: { x: number; y: number; width: number; height: number }
      overlay?: { x: number; y: number }
      reference?: { x: number; y: number; width: number; height: number }
    }) => void,
  ): (() => void) =>
    onChannel('artquest:v1:window-bounds:report', (bounds: unknown) => {
      if (bounds && typeof bounds === 'object') {
        handler(bounds as Parameters<typeof handler>[0])
      }
    })

  const onNavigate = (handler: (route: string) => void): (() => void) =>
    onChannel('artquest:v1:navigate', handler)

  const trackTelemetry = async (entry: Record<string, unknown>): Promise<{ success: boolean }> =>
    (await invokeIpc('artquest:v1:telemetry:track', entry)) as { success: boolean }

  const activityTrackingNative = process.platform === 'win32'

  return {
    syncDesktopSettings,
    pickArtAppExecutable,
    showTestNotification,
    setTaskbarProgress,
    applyWindowBounds,
    onWindowBoundsReport,
    onNavigate,
    trackTelemetry,
    activityTrackingNative,
    namespace: {
      syncSettings: syncDesktopSettings,
      pickArtAppExecutable,
      showTestNotification,
      setTaskbarProgress,
      applyWindowBounds,
      onWindowBoundsReport,
      onNavigate,
      trackTelemetry,
      activityTrackingNative,
    },
  }
}

export type DesktopApi = ReturnType<typeof createDesktopApi>
