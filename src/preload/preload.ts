import { contextBridge, ipcRenderer } from 'electron';

import type { IpcResult, LoadProgressResult } from './ipcTypes';
import type { StorageMode } from '../shared/storageMode';

interface SavedImage {
  id?: string;
  filename: string;
  path: string;
  questId: number | null;
  date: string;
  mediaType?: 'image' | 'video';
  thumbnailPath?: string;
  storageMode?: StorageMode | 'google_drive';
  cloudProvider?: string;
  remoteFileId?: string;
  remotePath?: string;
  syncStatus?: string;
  syncError?: string;
  lastSyncAt?: string;
}

type CloudAccount = {
  provider: 'google';
  connected: boolean;
  accountEmail: string | null;
  remoteRootPath: string;
  remoteRootFolderId?: string | null;
  connectedAt: string | null;
  updatedAt: string;
}

type AppBeforeQuitHandler = () => void

type QuestSessionCommand =
  | 'advancePhase'
  | 'toggleOverlay'
  | 'openReferences'
  | 'showMainWindow'
  | 'openQuestFinish'
  | 'cancelQuestSession'
  | 'finishPractice'
  | 'cancelPractice'

type SessionOverlayPayload = {
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
  isReferencePhase?: boolean
  labels?: Record<string, string>
}

type SessionOverlayPatch = {
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

type ReferenceWindowParams = {
  mode?: string
  questId?: number
  nodeId?: string
  category?: string
  tags?: string[]
  lang?: string
  source?: string
}

type GallerySyncResult = {
  success: boolean
  requeued?: number
  migrated?: number
  uploaded?: number
  failed?: number
  downloaded?: number
  linked?: number
  lastError?: string | null
  needsScopeReconnect?: boolean
  error?: string
}

/** Survives overlay React mount / lazy-load so early IPC updates are not lost. */
let overlayPayloadCache: SessionOverlayPayload = { hasSession: false }

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

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing API methods
  saveProgress: async (data: string): Promise<IpcResult> => {
    try {
      const result = await ipcRenderer.invoke('save-progress', data) as IpcResult;
      return result;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  saveProgressSync: (data: string): IpcResult => {
    try {
      const result = ipcRenderer.sendSync('save-progress-sync', data);
      return (result ?? { success: false, error: 'no response' }) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  loadProgress: async (): Promise<LoadProgressResult> => {
    try {
      const result = await ipcRenderer.invoke('load-progress');
      if (result && typeof result === 'object' && 'status' in result) {
        return result as LoadProgressResult;
      }
      // Legacy plain-object response (pre-v1.0.4)
      if (result && typeof result === 'object') {
        return { status: 'ok', data: result as Record<string, unknown> };
      }
      if (result == null) return { status: 'empty' };
      return { status: 'failed', message: 'Invalid load-progress response' };
    } catch (err) {
      return { status: 'failed', message: String(err) };
    }
  },
  readCorruptProgressBackup: async (
    backupPath: string,
  ): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> => {
    try {
      const result = await ipcRenderer.invoke('read-corrupt-progress-backup', backupPath);
      if (result && typeof result === 'object' && 'success' in result) {
        return result as { success: true; data: Record<string, unknown> } | { success: false; error: string };
      }
      return { success: false, error: 'Invalid read-corrupt-progress-backup response' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  clearProgress: async (): Promise<IpcResult> => {
    try {
      const result = await ipcRenderer.invoke('clear-progress');
      if (result && typeof result === 'object' && 'success' in result) {
        return result as IpcResult;
      }
      return { success: false, error: 'Invalid clear-progress response' };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  saveImage: async (base64Data: string, questId: string): Promise<IpcResult & { path?: string; galleryItemId?: string; syncStatus?: string; storageMode?: string }> => {
    try {
      const result = await ipcRenderer.invoke('save-image', base64Data, questId);
      return result as IpcResult & { path?: string; galleryItemId?: string; syncStatus?: string; storageMode?: string };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  saveQuestReference: async (base64Data: string, questId: string): Promise<IpcResult & { id?: string; path?: string }> => {
    try {
      return await ipcRenderer.invoke('save-quest-reference', base64Data, questId) as IpcResult & { id?: string; path?: string };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  deleteQuestReference: async (filePath: string): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('delete-quest-reference', filePath) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  getSavedImages: async (): Promise<SavedImage[]> => {
    try {
      return await ipcRenderer.invoke('get-saved-images');
    } catch {
      return [];
    }
  },
  readImage: async (filepath: string): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke('read-image', filepath);
    } catch {
      return null;
    }
  },
  getLocalMediaUrl: async (filepath: string): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke('get-local-media-url', filepath);
    } catch {
      return null;
    }
  },
  pickPortraitImage: async (): Promise<{ success: boolean; dataUrl?: string; error?: unknown }> => {
    try {
      return await ipcRenderer.invoke('pick-portrait-image') as { success: boolean; dataUrl?: string; error?: unknown };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  saveCustomAvatar: async (base64Data: string): Promise<IpcResult & { path?: string }> => {
    try {
      return await ipcRenderer.invoke('save-custom-avatar', base64Data) as IpcResult & { path?: string };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  syncDesktopSettings: async (payload: Record<string, unknown>): Promise<void> => {
    try {
      await ipcRenderer.invoke('sync-desktop-settings', payload);
    } catch (err) {
      console.warn('syncDesktopSettings:', err);
    }
  },
  showTestNotification: async (payload: { title: string; body: string }): Promise<{ success: boolean }> => {
    try {
      return (await ipcRenderer.invoke('show-test-notification', payload)) as { success: boolean };
    } catch {
      return { success: false };
    }
  },
  dispatchQuestSessionCommand: async (command: QuestSessionCommand): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:quest-session:dispatch-command', command) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  onQuestSessionCommand: (handler: (command: QuestSessionCommand) => void): (() => void) => {
    const listener = (_event: unknown, command: QuestSessionCommand) => {
      try {
        handler(command)
      } catch (err) {
        console.error('onQuestSessionCommand handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:quest-session:command', listener)
    return () => ipcRenderer.removeListener('artquest:v1:quest-session:command', listener)
  },
  setQuestOverlayPayload: async (payload: SessionOverlayPayload): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:set-payload', payload) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  setQuestOverlayPatch: async (patch: SessionOverlayPatch): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:set-patch', patch) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  setOverlayLayout: async (opts: {
    sessionType?: 'quest' | 'practice'
    refsOpen?: boolean
    contentHeight?: number
  }): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:set-layout', opts) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  setSessionOverlayActive: async (active: boolean): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:set-session-active', active) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  openSessionOverlay: async (opts?: { hideMain?: boolean }): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:open', opts ?? {}) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  hideSessionOverlay: async (): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:hide') as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  openReferenceWindow: async (params: ReferenceWindowParams): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:reference-window:open', params) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  openUrlInReferenceWindow: async (url: string): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:reference-window:navigate', url) as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  toggleQuestOverlay: async (): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:toggle') as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  expandQuestOverlay: async (): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:expand') as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  cancelQuestOverlay: async (): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:cancel') as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  closeQuestOverlay: async (): Promise<IpcResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:overlay:expand') as IpcResult;
    } catch (err) {
      return { success: false, error: err };
    }
  },
  onReferenceWindowNavigate: (handler: (url: string) => void): (() => void) => {
    const listener = (_event: unknown, url: string) => {
      try {
        handler(url)
      } catch (err) {
        console.error('onReferenceWindowNavigate handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:reference-window:navigate', listener)
    return () => ipcRenderer.removeListener('artquest:v1:reference-window:navigate', listener)
  },
  onActivityUpdate: (
    handler: (state: {
      processName: string
      idleSec: number
      artAppActive: boolean
      userActive: boolean
      shouldCountTime: boolean
    }) => void,
  ): (() => void) => {
    const listener = (_event: unknown, state: {
      processName: string
      idleSec: number
      artAppActive: boolean
      userActive: boolean
      shouldCountTime: boolean
    }) => {
      try {
        handler(state)
      } catch (err) {
        console.error('onActivityUpdate handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:activity:update', listener)
    return () => ipcRenderer.removeListener('artquest:v1:activity:update', listener)
  },
  onSessionTick: (handler: () => void): (() => void) => {
    const listener = () => {
      try {
        handler()
      } catch (err) {
        console.error('onSessionTick handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:session:tick', listener)
    return () => ipcRenderer.removeListener('artquest:v1:session:tick', listener)
  },
  setSessionTickActive: (active: boolean): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('artquest:v1:session:set-tick-active', active) as Promise<{ success: boolean }>,
  onNavigate: (handler: (route: string) => void): (() => void) => {
    const listener = (_event: unknown, route: string) => {
      try {
        handler(route)
      } catch (err) {
        console.error('onNavigate handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:navigate', listener)
    return () => ipcRenderer.removeListener('artquest:v1:navigate', listener)
  },
  onOverlayRequestSync: (handler: () => void): (() => void) => {
    const listener = () => {
      try {
        handler()
      } catch (err) {
        console.error('onOverlayRequestSync handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:overlay:request-sync', listener)
    return () => ipcRenderer.removeListener('artquest:v1:overlay:request-sync', listener)
  },
  getQuestOverlaySnapshot: (): SessionOverlayPayload => overlayPayloadCache,
  getQuestOverlayPayload: async (): Promise<{
    success: boolean
    payload?: SessionOverlayPayload
    error?: unknown
  }> => {
    try {
      return (await ipcRenderer.invoke('artquest:v1:overlay:get-payload')) as {
        success: boolean
        payload?: SessionOverlayPayload
        error?: unknown
      }
    } catch (err) {
      return { success: false, error: err }
    }
  },
  notifyOverlayReady: async (): Promise<IpcResult> => {
    try {
      return (await ipcRenderer.invoke('artquest:v1:overlay:ready')) as IpcResult
    } catch (err) {
      return { success: false, error: err }
    }
  },
  onQuestOverlayUpdate: (handler: (payload: SessionOverlayPayload) => void): (() => void) => {
    try {
      handler(overlayPayloadCache)
    } catch (err) {
      console.error('onQuestOverlayUpdate replay failed:', err)
    }
    const listener = (_event: unknown, payload: SessionOverlayPayload) => {
      try {
        handler(payload)
      } catch (err) {
        console.error('onQuestOverlayUpdate handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:overlay:update', listener)
    return () => ipcRenderer.removeListener('artquest:v1:overlay:update', listener)
  },
  onQuestOverlayPatch: (handler: (patch: SessionOverlayPatch) => void): (() => void) => {
    const listener = (_event: unknown, patch: SessionOverlayPatch) => {
      try {
        handler(patch)
      } catch (err) {
        console.error('onQuestOverlayPatch handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:overlay:patch', listener)
    return () => ipcRenderer.removeListener('artquest:v1:overlay:patch', listener)
  },
  showItemInFolder: async (filePath: string): Promise<void> => {
    try {
      await ipcRenderer.invoke('show-item-in-folder', filePath);
    } catch (err) {
      console.error('Failed to show item in folder:', err);
    }
  },
  openExternal: async (url: string): Promise<{ success: boolean; error?: unknown }> => {
    try {
      return (await ipcRenderer.invoke('open-external', url)) as { success: boolean; error?: unknown };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  getStorageMode: async (): Promise<{ success: boolean; mode?: StorageMode; error?: unknown }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:storage:getMode') as { success: boolean; mode?: StorageMode; error?: unknown };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  setStorageMode: async (mode: StorageMode): Promise<{ success: boolean; mode?: StorageMode; error?: unknown }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:storage:setMode', mode) as { success: boolean; mode?: StorageMode; error?: unknown };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  connectGoogleDrive: async (): Promise<{ success: boolean; account?: CloudAccount; error?: string }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:cloud:google:connect') as { success: boolean; account?: CloudAccount; error?: string };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  disconnectGoogleDrive: async (): Promise<{ success: boolean; account?: CloudAccount; error?: string }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:cloud:google:disconnect') as { success: boolean; account?: CloudAccount; error?: string };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  setGoogleDrivePath: async (drivePath: string): Promise<{ success: boolean; account?: CloudAccount; error?: string }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:cloud:google:setPath', drivePath) as { success: boolean; account?: CloudAccount; error?: string };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  getGoogleDriveStatus: async (): Promise<{
    success: boolean
    account?: CloudAccount
    lastUploadError?: string | null
    needsScopeReconnect?: boolean
    folderWebUrl?: string | null
    error?: string
  }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:cloud:google:getStatus') as {
        success: boolean
        account?: CloudAccount
        lastUploadError?: string | null
        needsScopeReconnect?: boolean
        folderWebUrl?: string | null
        error?: string
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  retryGalleryUpload: async (galleryItemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:gallery:retryUpload', galleryItemId) as { success: boolean; error?: string };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  retryAllGalleryUploads: async (): Promise<GallerySyncResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:gallery:retryAllUploads') as GallerySyncResult;
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  syncGallery: async (): Promise<GallerySyncResult> => {
    try {
      return await ipcRenderer.invoke('artquest:v1:gallery:sync') as GallerySyncResult;
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
  onAppBeforeQuit: (handler: AppBeforeQuitHandler): (() => void) => {
    const listener = () => {
      try {
        handler()
      } catch (err) {
        console.error('onAppBeforeQuit handler failed:', err)
      } finally {
        ipcRenderer.send('app-before-quit-done')
      }
    }
    ipcRenderer.on('app-before-quit', listener)
    return () => {
      ipcRenderer.removeListener('app-before-quit', listener)
    }
  },
  onGallerySyncUpdated: (handler: () => void): (() => void) => {
    const listener = () => {
      try {
        handler()
      } catch (err) {
        console.error('onGallerySyncUpdated handler failed:', err)
      }
    }
    ipcRenderer.on('artquest:v1:gallery:syncUpdated', listener)
    return () => {
      ipcRenderer.removeListener('artquest:v1:gallery:syncUpdated', listener)
    }
  },
  saveShareCardPng: async (base64Data: string, filename: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
      return (await ipcRenderer.invoke('save-share-card-png', base64Data, filename)) as { success: boolean; path?: string; error?: string }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },
  exportProgressFile: async (jsonPayload: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
      return (await ipcRenderer.invoke('export-progress-file', jsonPayload)) as { success: boolean; path?: string; error?: string }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },
  importProgressFile: async (): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> => {
    try {
      return (await ipcRenderer.invoke('import-progress-file')) as { success: boolean; data?: Record<string, unknown>; error?: string }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },
});
