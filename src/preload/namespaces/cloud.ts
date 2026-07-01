import type { IpcResult } from '../ipcTypes'
import type { StorageMode } from '../../shared/storageMode'
import { invokeIpc } from '../ipcHelpers'

type CloudAccount = {
  provider: 'google'
  connected: boolean
  accountEmail: string | null
  remoteRootPath: string
  remoteRootFolderId?: string | null
  connectedAt: string | null
  updatedAt: string
}

export function createCloudApi() {
  const getStorageMode = async (): Promise<{ success: boolean; mode?: StorageMode; error?: unknown }> =>
    (await invokeIpc('artquest:v1:storage:getMode')) as {
      success: boolean
      mode?: StorageMode
      error?: unknown
    }

  const setStorageMode = async (
    mode: StorageMode,
  ): Promise<{ success: boolean; mode?: StorageMode; error?: unknown }> =>
    (await invokeIpc('artquest:v1:storage:setMode', mode)) as {
      success: boolean
      mode?: StorageMode
      error?: unknown
    }

  const connectGoogleDrive = async (): Promise<{ success: boolean; account?: CloudAccount; error?: string }> =>
    (await invokeIpc('artquest:v1:cloud:google:connect')) as {
      success: boolean
      account?: CloudAccount
      error?: string
    }

  const disconnectGoogleDrive = async (): Promise<{ success: boolean; account?: CloudAccount; error?: string }> =>
    (await invokeIpc('artquest:v1:cloud:google:disconnect')) as {
      success: boolean
      account?: CloudAccount
      error?: string
    }

  const setGoogleDrivePath = async (
    drivePath: string,
  ): Promise<{ success: boolean; account?: CloudAccount; error?: string }> =>
    (await invokeIpc('artquest:v1:cloud:google:setPath', drivePath)) as {
      success: boolean
      account?: CloudAccount
      error?: string
    }

  const getGoogleDriveStatus = async (): Promise<{
    success: boolean
    account?: CloudAccount
    lastUploadError?: string | null
    needsScopeReconnect?: boolean
    folderWebUrl?: string | null
    error?: string
  }> =>
    (await invokeIpc('artquest:v1:cloud:google:getStatus')) as {
      success: boolean
      account?: CloudAccount
      lastUploadError?: string | null
      needsScopeReconnect?: boolean
      folderWebUrl?: string | null
      error?: string
    }

  return {
    getStorageMode,
    setStorageMode,
    connectGoogleDrive,
    disconnectGoogleDrive,
    setGoogleDrivePath,
    getGoogleDriveStatus,
    namespace: {
      getMode: getStorageMode,
      setMode: setStorageMode,
      connectGoogleDrive,
      disconnectGoogleDrive,
      setGoogleDrivePath,
      getGoogleDriveStatus,
    },
  }
}

export type CloudApi = ReturnType<typeof createCloudApi>
