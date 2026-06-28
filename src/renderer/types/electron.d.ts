import type { IpcResult, LoadProgressResult } from '../../preload/ipcTypes'
import type { StorageMode } from '../../shared/storageMode'
import type { MaterialVideoMode } from '../utils/materialExternalCatalog'
import type { QuestCategory } from '../data/skillTree'
import type { Language } from '../i18n/translations'
import type { ReferenceSource } from '../store/models'

interface SavedImage {
  id?: string
  filename: string
  path: string
  questId: number | null
  date: string
  mediaType?: 'image' | 'video'
  thumbnailPath?: string
  storageMode?: StorageMode | 'google_drive'
  cloudProvider?: 'google'
  remoteFileId?: string
  remotePath?: string
  syncStatus?: string
  syncError?: string
  lastSyncAt?: string
}

interface CloudAccount {
  provider: 'google'
  connected: boolean
  accountEmail: string | null
  remoteRootPath: string
  remoteRootFolderId?: string | null
  connectedAt: string | null
  updatedAt: string
}

export type QuestSessionCommand =
  | 'advancePhase'
  | 'toggleOverlay'
  | 'openReferences'
  | 'showMainWindow'
  | 'openQuestFinish'
  | 'cancelQuestSession'
  | 'finishPractice'
  | 'cancelPractice'

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

export type SessionOverlayPayload = {
  hasSession: boolean
  sessionType?: 'quest' | 'practice'
  theme?: string
  lang?: Language
  questId?: number
  nodeId?: string
  category?: QuestCategory
  preferredTags?: string[]
  questTitle?: string
  timerLabel?: string
  phaseLabel?: string
  isRunning?: boolean
  isExpired?: boolean
  isTimerPaused?: boolean
  canAdvancePhase?: boolean
  canSubmitQuest?: boolean
  canFinishPractice?: boolean
  isReferencePhase?: boolean
  inGracePeriod?: boolean
  labels?: {
    needReferences: string
    youtubeLong: string
    youtubeShort: string
    pinterest: string
    clipTips: string
    sketchfab: string
    next: string
    submit?: string
    expand: string
    collapse?: string
    cancel: string
    open: string
    close: string
    finish?: string
    timerPaused?: string
    gracePeriodHint?: string
    overlayEmpty?: string
    practiceMinHint?: string
  }
}

/** @deprecated Use SessionOverlayPayload */
export type QuestOverlayPayload = SessionOverlayPayload

export type ReferenceWindowParams = {
  mode: MaterialVideoMode
  questId?: number
  nodeId?: string
  category?: QuestCategory | 'all'
  tags?: string[]
  lang?: Language
  source?: ReferenceSource
}

export interface ElectronAPI {
  saveProgress: (data: string) => Promise<IpcResult>
  saveProgressSync: (data: string) => IpcResult
  loadProgress: () => Promise<LoadProgressResult>
  readCorruptProgressBackup: (
    backupPath: string,
  ) => Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }>
  clearProgress: () => Promise<IpcResult>
  saveImage: (base64: string, questId: string) => Promise<
    IpcResult & { path?: string; galleryItemId?: string; syncStatus?: string; storageMode?: string }
  >
  saveQuestReference: (base64: string, questId: string) => Promise<IpcResult & { id?: string; path?: string }>
  deleteQuestReference: (filePath: string) => Promise<IpcResult>
  getSavedImages: () => Promise<SavedImage[]>
  readImage: (filepath: string) => Promise<string | null>
  getLocalMediaUrl: (filepath: string) => Promise<string | null>
  pickPortraitImage: () => Promise<{ success: boolean; dataUrl?: string; error?: unknown }>
  saveCustomAvatar: (base64: string) => Promise<IpcResult & { path?: string }>
  syncDesktopSettings: (payload: Record<string, unknown>) => Promise<void>
  showTestNotification: (payload: { title: string; body: string }) => Promise<{ success: boolean }>
  dispatchQuestSessionCommand: (command: QuestSessionCommand) => Promise<IpcResult>
  onQuestSessionCommand: (handler: (command: QuestSessionCommand) => void) => () => void
  setQuestOverlayPayload: (payload: SessionOverlayPayload) => Promise<IpcResult>
  setQuestOverlayPatch: (patch: SessionOverlayPatch) => Promise<IpcResult>
  setOverlayLayout: (opts: {
    sessionType?: 'quest' | 'practice'
    refsOpen?: boolean
    contentHeight?: number
  }) => Promise<IpcResult>
  setSessionOverlayActive: (active: boolean) => Promise<IpcResult>
  openSessionOverlay: (opts?: { hideMain?: boolean }) => Promise<IpcResult>
  hideSessionOverlay: () => Promise<IpcResult>
  expandQuestOverlay: () => Promise<IpcResult>
  cancelQuestOverlay: () => Promise<IpcResult>
  toggleQuestOverlay: () => Promise<IpcResult>
  /** @deprecated Use expandQuestOverlay */
  closeQuestOverlay: () => Promise<IpcResult>
  getQuestOverlaySnapshot: () => SessionOverlayPayload
  getQuestOverlayPayload: () => Promise<{
    success: boolean
    payload?: SessionOverlayPayload
    error?: unknown
  }>
  notifyOverlayReady: () => Promise<IpcResult>
  onOverlayRequestSync: (handler: () => void) => () => void
  onQuestOverlayUpdate: (handler: (payload: SessionOverlayPayload) => void) => () => void
  onQuestOverlayPatch: (handler: (patch: SessionOverlayPatch) => void) => () => void
  openReferenceWindow: (params: ReferenceWindowParams) => Promise<IpcResult>
  openUrlInReferenceWindow: (url: string) => Promise<IpcResult>
  onReferenceWindowNavigate: (handler: (url: string) => void) => () => void
  onActivityUpdate: (
    handler: (state: {
      processName: string
      idleSec: number
      artAppActive: boolean
      userActive: boolean
      shouldCountTime: boolean
    }) => void,
  ) => () => void
  onSessionTick: (handler: () => void) => () => void
  setSessionTickActive: (active: boolean) => Promise<{ success: boolean }>
  onNavigate: (handler: (route: string) => void) => () => void
  showItemInFolder: (filePath: string) => Promise<void>
  openExternal: (url: string) => Promise<{ success: boolean; error?: unknown }>
  getStorageMode: () => Promise<{ success: boolean; mode?: StorageMode; error?: unknown }>
  setStorageMode: (mode: StorageMode) => Promise<{ success: boolean; mode?: StorageMode; error?: unknown }>
  connectGoogleDrive: () => Promise<{ success: boolean; account?: CloudAccount; error?: string }>
  disconnectGoogleDrive: () => Promise<{ success: boolean; account?: CloudAccount; error?: string }>
  setGoogleDrivePath: (drivePath: string) => Promise<{ success: boolean; account?: CloudAccount; error?: string }>
  getGoogleDriveStatus: () => Promise<{
    success: boolean
    account?: CloudAccount
    lastUploadError?: string | null
    needsScopeReconnect?: boolean
    folderWebUrl?: string | null
    error?: string
  }>
  retryGalleryUpload: (galleryItemId: string) => Promise<{ success: boolean; error?: string }>
  retryAllGalleryUploads: () => Promise<GallerySyncResult>
  syncGallery: () => Promise<GallerySyncResult>
  onAppBeforeQuit: (handler: () => void) => () => void
  onGallerySyncUpdated: (handler: () => void) => () => void
  saveShareCardPng: (base64Data: string, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>
  exportProgressFile: (jsonPayload: string) => Promise<{ success: boolean; path?: string; error?: string }>
  importProgressFile: () => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>
}

interface GallerySyncResult {
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
