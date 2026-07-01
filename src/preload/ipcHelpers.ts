import { ipcRenderer } from 'electron'
import type { IpcResult } from './ipcTypes'

export { ipcRenderer }

export async function invokeIpc<T>(channel: string, ...args: unknown[]): Promise<T | IpcResult> {
  try {
    return (await ipcRenderer.invoke(channel, ...args)) as T
  } catch (err) {
    return { success: false, error: err }
  }
}

export function invokeIpcSync<T>(channel: string, ...args: unknown[]): T | IpcResult {
  try {
    const result = ipcRenderer.sendSync(channel, ...args)
    return (result ?? { success: false, error: 'no response' }) as T
  } catch (err) {
    return { success: false, error: err }
  }
}

export function onVoidChannel(channel: string, handler: () => void): () => void {
  const listener = () => {
    try {
      handler()
    } catch (err) {
      console.error(`${channel} handler failed:`, err)
    }
  }
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

export function onChannel<T>(
  channel: string,
  handler: (payload: T) => void,
  replay?: T,
): () => void {
  if (replay !== undefined) {
    try {
      handler(replay)
    } catch (err) {
      console.error(`${channel} replay failed:`, err)
    }
  }
  const listener = (_event: unknown, payload: T) => {
    try {
      handler(payload)
    } catch (err) {
      console.error(`${channel} handler failed:`, err)
    }
  }
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}
