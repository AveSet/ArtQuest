import { invokeIpc } from '../ipcHelpers'

export function createShellApi() {
  const showItemInFolder = async (filePath: string): Promise<void> => {
    try {
      await invokeIpc('show-item-in-folder', filePath)
    } catch (err) {
      console.error('Failed to show item in folder:', err)
    }
  }

  const openExternal = async (url: string): Promise<{ success: boolean; error?: unknown }> =>
    (await invokeIpc('open-external', url)) as { success: boolean; error?: unknown }

  const saveShareCardPng = async (
    base64Data: string,
    filename: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> =>
    (await invokeIpc('save-share-card-png', base64Data, filename)) as {
      success: boolean
      path?: string
      error?: string
    }

  return {
    showItemInFolder,
    openExternal,
    saveShareCardPng,
    namespace: {
      showItemInFolder,
      openExternal,
      saveShareCardPng,
    },
  }
}
