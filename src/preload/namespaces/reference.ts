import type { IpcResult } from '../ipcTypes'
import { invokeIpc, onChannel } from '../ipcHelpers'

export type ReferenceWindowParams = {
  mode?: string
  questId?: number
  nodeId?: string
  category?: string
  tags?: string[]
  lang?: string
  source?: string
}

export function createReferenceApi() {
  const openReferenceWindow = async (params: ReferenceWindowParams): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:reference-window:open', params)) as IpcResult

  const openUrlInReferenceWindow = async (url: string): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:reference-window:navigate', url)) as IpcResult

  const onReferenceWindowNavigate = (handler: (url: string) => void): (() => void) =>
    onChannel('artquest:v1:reference-window:navigate', handler)

  return {
    openReferenceWindow,
    openUrlInReferenceWindow,
    onReferenceWindowNavigate,
    namespace: {
      open: openReferenceWindow,
      navigate: openUrlInReferenceWindow,
      onNavigate: onReferenceWindowNavigate,
    },
  }
}

export type ReferenceApi = ReturnType<typeof createReferenceApi>
