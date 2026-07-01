import type { IpcResult, LoadProgressResult } from '../ipcTypes'
import { invokeIpc, invokeIpcSync, onVoidChannel, ipcRenderer } from '../ipcHelpers'

type AppBeforeQuitHandler = () => void | Promise<void>

export function createProgressApi() {
  const saveProgress = async (data: string): Promise<IpcResult> =>
    (await invokeIpc<IpcResult>('save-progress', data)) as IpcResult

  const saveProgressSync = (data: string): IpcResult =>
    invokeIpcSync<IpcResult>('save-progress-sync', data) as IpcResult

  const loadProgress = async (): Promise<LoadProgressResult> => {
    try {
      const result = await invokeIpc<LoadProgressResult | Record<string, unknown>>('load-progress')
      if (result && typeof result === 'object' && 'status' in result) {
        return result as LoadProgressResult
      }
      if (result && typeof result === 'object' && !('success' in result)) {
        return { status: 'ok', data: result as Record<string, unknown> }
      }
      if (result == null) return { status: 'empty' }
      return { status: 'failed', message: 'Invalid load-progress response' }
    } catch (err) {
      return { status: 'failed', message: String(err) }
    }
  }

  const readCorruptProgressBackup = async (
    backupPath: string,
  ): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> => {
    const result = await invokeIpc('read-corrupt-progress-backup', backupPath)
    if (result && typeof result === 'object' && 'success' in result) {
      return result as { success: true; data: Record<string, unknown> } | { success: false; error: string }
    }
    return { success: false, error: 'Invalid read-corrupt-progress-backup response' }
  }

  const clearProgress = async (): Promise<IpcResult> => {
    const result = await invokeIpc<IpcResult>('clear-progress')
    if (result && typeof result === 'object' && 'success' in result) return result as IpcResult
    return { success: false, error: 'Invalid clear-progress response' }
  }

  const exportProgressFile = async (
    jsonPayload: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> =>
    (await invokeIpc('export-progress-file', jsonPayload)) as {
      success: boolean
      path?: string
      error?: string
    }

  const importProgressFile = async (): Promise<{
    success: boolean
    data?: Record<string, unknown>
    error?: string
  }> =>
    (await invokeIpc('import-progress-file')) as {
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }

  const appendCompletionLog = async (entry: Record<string, unknown>): Promise<IpcResult> =>
    (await invokeIpc('artquest:v1:progress:append-log', entry)) as IpcResult

  const onAppBeforeQuit = (handler: AppBeforeQuitHandler): (() => void) =>
    onVoidChannel('app-before-quit', () => {
      void (async () => {
        try {
          await Promise.resolve(handler())
        } catch (err) {
          console.error('onAppBeforeQuit handler failed:', err)
        } finally {
          ipcRenderer.send('app-before-quit-done')
        }
      })()
    })

  return {
    saveProgress,
    saveProgressSync,
    loadProgress,
    readCorruptProgressBackup,
    clearProgress,
    exportProgressFile,
    importProgressFile,
    appendCompletionLog,
    onAppBeforeQuit,
    namespace: {
      save: saveProgress,
      saveSync: saveProgressSync,
      load: loadProgress,
      readCorruptBackup: readCorruptProgressBackup,
      clear: clearProgress,
      exportFile: exportProgressFile,
      importFile: importProgressFile,
      appendLog: appendCompletionLog,
      onBeforeQuit: onAppBeforeQuit,
    },
  }
}

export type ProgressApi = ReturnType<typeof createProgressApi>
