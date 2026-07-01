import type { IpcResult } from '../ipcTypes'
import { ipcRenderer, invokeIpc, onChannel, onVoidChannel } from '../ipcHelpers'

export type SessionOverlayPayload = {
  hasSession: boolean
  sessionType?: 'quest' | 'practice'
  theme?: string
  lang?: string
  questId?: number
  nodeId?: string
  category?: string
  preferredTags?: string[]
  questTitle?: string
  timerLabel?: string
  phaseLabel?: string
  isRunning?: boolean
  isExpired?: boolean
  isTimerPaused?: boolean
  canAdvancePhase?: boolean
  labels?: Record<string, string>
}

export type SessionOverlayPatch = {
  timerLabel?: string
  phaseLabel?: string
  isRunning?: boolean
  isExpired?: boolean
  isTimerPaused?: boolean
  canAdvancePhase?: boolean
  canSubmitQuest?: boolean
  canFinishPractice?: boolean
  inGracePeriod?: boolean
  isReferencePhase?: boolean
}

let overlayPayloadCache: SessionOverlayPayload = { hasSession: false }

export function installOverlayPayloadCache(): void {
  ipcRenderer.on('artquest:v1:overlay:update', (_event, payload: SessionOverlayPayload) => {
    if (payload && typeof payload === 'object') {
      overlayPayloadCache = payload
    }
  })

  ipcRenderer.on('artquest:v1:overlay:patch', (_event, patch: SessionOverlayPatch) => {
    if (patch && typeof patch === 'object') {
      overlayPayloadCache = { ...overlayPayloadCache, ...patch }
    }
  })
}

export function createOverlayApi() {
  const setQuestOverlayPayload = async (payload: SessionOverlayPayload): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:set-payload', payload)) as IpcResult

  const setQuestOverlayPatch = async (patch: SessionOverlayPatch): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:set-patch', patch)) as IpcResult

  const setOverlayLayout = async (opts: {
    sessionType?: 'quest' | 'practice'
    refsOpen?: boolean
    contentHeight?: number
  }): Promise<IpcResult> => (await invokeIpc('artquest:v1:overlay:set-layout', opts)) as IpcResult

  const setSessionOverlayActive = async (active: boolean): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:set-session-active', active)) as IpcResult

  const openSessionOverlay = async (opts?: { hideMain?: boolean }): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:open', opts ?? {})) as IpcResult

  const hideSessionOverlay = async (): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:hide')) as IpcResult

  const toggleQuestOverlay = async (): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:toggle')) as IpcResult

  const expandQuestOverlay = async (): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:expand')) as IpcResult

  const cancelQuestOverlay = async (): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:cancel')) as IpcResult

  const closeQuestOverlay = expandQuestOverlay

  const getQuestOverlaySnapshot = (): SessionOverlayPayload => overlayPayloadCache

  const getQuestOverlayPayload = async (): Promise<{
    success: boolean
    payload?: SessionOverlayPayload
    error?: unknown
  }> =>
    (await invokeIpc('artquest:v1:overlay:get-payload')) as {
      success: boolean
      payload?: SessionOverlayPayload
      error?: unknown
    }

  const notifyOverlayReady = async (): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:overlay:ready')) as IpcResult

  const onOverlayRequestSync = (handler: () => void): (() => void) =>
    onVoidChannel('artquest:v1:overlay:request-sync', handler)

  const onQuestOverlayUpdate = (handler: (payload: SessionOverlayPayload) => void): (() => void) =>
    onChannel('artquest:v1:overlay:update', handler, overlayPayloadCache)

  const onQuestOverlayPatch = (handler: (patch: SessionOverlayPatch) => void): (() => void) =>
    onChannel('artquest:v1:overlay:patch', handler)

  return {
    setQuestOverlayPayload,
    setQuestOverlayPatch,
    setOverlayLayout,
    setSessionOverlayActive,
    openSessionOverlay,
    hideSessionOverlay,
    toggleQuestOverlay,
    expandQuestOverlay,
    cancelQuestOverlay,
    closeQuestOverlay,
    getQuestOverlaySnapshot,
    getQuestOverlayPayload,
    notifyOverlayReady,
    onOverlayRequestSync,
    onQuestOverlayUpdate,
    onQuestOverlayPatch,
    namespace: {
      setPayload: setQuestOverlayPayload,
      setPatch: setQuestOverlayPatch,
      setLayout: setOverlayLayout,
      setSessionActive: setSessionOverlayActive,
      open: openSessionOverlay,
      hide: hideSessionOverlay,
      toggle: toggleQuestOverlay,
      expand: expandQuestOverlay,
      cancel: cancelQuestOverlay,
      close: closeQuestOverlay,
      getSnapshot: getQuestOverlaySnapshot,
      getPayload: getQuestOverlayPayload,
      notifyReady: notifyOverlayReady,
      onRequestSync: onOverlayRequestSync,
      onUpdate: onQuestOverlayUpdate,
      onPatch: onQuestOverlayPatch,
    },
  }
}

export type OverlayApi = ReturnType<typeof createOverlayApi>
