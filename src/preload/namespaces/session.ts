import type { IpcResult } from '../ipcTypes'
import { invokeIpc, onChannel, onVoidChannel } from '../ipcHelpers'

export type QuestSessionCommand =
  | 'advancePhase'
  | 'toggleOverlay'
  | 'openReferences'
  | 'showMainWindow'
  | 'openQuestFinish'
  | 'cancelQuestSession'
  | 'finishPractice'
  | 'cancelPractice'

type ActivityState = {
  processName: string
  idleSec: number
  artAppActive: boolean
  userActive: boolean
  shouldCountTime: boolean
}

export function createSessionApi() {
  const dispatchQuestSessionCommand = async (command: QuestSessionCommand): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:quest-session:dispatch-command', command)) as IpcResult

  const onQuestSessionCommand = (handler: (command: QuestSessionCommand) => void): (() => void) =>
    onChannel('artquest:v1:quest-session:command', handler)

  const onActivityUpdate = (handler: (state: ActivityState) => void): (() => void) =>
    onChannel('artquest:v1:activity:update', handler)

  const onSessionTick = (handler: () => void): (() => void) =>
    onVoidChannel('artquest:v1:session:tick', handler)

  const setSessionTickActive = (active: boolean): Promise<{ success: boolean }> =>
    invokeIpc('artquest:v1:session:set-tick-active', active) as Promise<{ success: boolean }>

  return {
    dispatchQuestSessionCommand,
    onQuestSessionCommand,
    onActivityUpdate,
    onSessionTick,
    setSessionTickActive,
    namespace: {
      dispatchCommand: dispatchQuestSessionCommand,
      onCommand: onQuestSessionCommand,
      onActivityUpdate,
      onTick: onSessionTick,
      setTickActive: setSessionTickActive,
    },
  }
}

export type SessionApi = ReturnType<typeof createSessionApi>
