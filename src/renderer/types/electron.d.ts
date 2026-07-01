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
    references?: string
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

export interface GallerySyncResult {
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

export interface ProgressNamespace {
  save: (data: string) => Promise<IpcResult>
  saveSync: (data: string) => IpcResult
  load: () => Promise<LoadProgressResult>
  readCorruptBackup: (
    backupPath: string,
  ) => Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }>
  clear: () => Promise<IpcResult>
  exportFile: (jsonPayload: string) => Promise<{ success: boolean; path?: string; error?: string }>
  importFile: () => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>
  appendLog: (entry: Record<string, unknown>) => Promise<IpcResult>
  onBeforeQuit: (handler: () => void | Promise<void>) => () => void
}

export interface ShellNamespace {
  showItemInFolder: (filePath: string) => Promise<void>
  openExternal: (url: string) => Promise<{ success: boolean; error?: unknown }>
  saveShareCardPng: (
    base64Data: string,
    filename: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>
}

export interface OverlayNamespace {
  setPayload: (payload: SessionOverlayPayload) => Promise<IpcResult>
  setPatch: (patch: SessionOverlayPatch) => Promise<IpcResult>
  setLayout: (opts: {
    sessionType?: 'quest' | 'practice'
    refsOpen?: boolean
    contentHeight?: number
  }) => Promise<IpcResult>
  setSessionActive: (active: boolean) => Promise<IpcResult>
  open: (opts?: { hideMain?: boolean }) => Promise<IpcResult>
  hide: () => Promise<IpcResult>
  toggle: () => Promise<IpcResult>
  expand: () => Promise<IpcResult>
  cancel: () => Promise<IpcResult>
  /** @deprecated Use expand */
  close: () => Promise<IpcResult>
  getSnapshot: () => SessionOverlayPayload
  getPayload: () => Promise<{
    success: boolean
    payload?: SessionOverlayPayload
    error?: unknown
  }>
  notifyReady: () => Promise<IpcResult>
  onRequestSync: (handler: () => void) => () => void
  onUpdate: (handler: (payload: SessionOverlayPayload) => void) => () => void
  onPatch: (handler: (patch: SessionOverlayPatch) => void) => () => void
}

export interface ReferenceNamespace {
  open: (params: ReferenceWindowParams) => Promise<IpcResult>
  navigate: (url: string) => Promise<IpcResult>
  onNavigate: (handler: (url: string) => void) => () => void
}

export interface CloudNamespace {
  getMode: () => Promise<{ success: boolean; mode?: StorageMode; error?: unknown }>
  setMode: (mode: StorageMode) => Promise<{ success: boolean; mode?: StorageMode; error?: unknown }>
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
}

export interface GalleryNamespace {
  saveImage: (
    base64: string,
    questId: string,
  ) => Promise<IpcResult & { path?: string; galleryItemId?: string; syncStatus?: string; storageMode?: string }>
  saveQuestReference: (base64: string, questId: string) => Promise<IpcResult & { id?: string; path?: string }>
  deleteQuestReference: (filePath: string) => Promise<IpcResult>
  listImages: () => Promise<SavedImage[]>
  readImage: (filepath: string) => Promise<string | null>
  getLocalMediaUrl: (filepath: string) => Promise<string | null>
  pickPortraitImage: () => Promise<{ success: boolean; dataUrl?: string; error?: unknown }>
  saveCustomAvatar: (base64: string) => Promise<IpcResult & { path?: string }>
  retryUpload: (galleryItemId: string) => Promise<{ success: boolean; error?: string }>
  retryAllUploads: () => Promise<GallerySyncResult>
  sync: () => Promise<GallerySyncResult>
  onSyncUpdated: (handler: () => void) => () => void
}

export interface SessionNamespace {
  dispatchCommand: (command: QuestSessionCommand) => Promise<IpcResult>
  onCommand: (handler: (command: QuestSessionCommand) => void) => () => void
  onActivityUpdate: (
    handler: (state: {
      processName: string
      idleSec: number
      artAppActive: boolean
      userActive: boolean
      shouldCountTime: boolean
    }) => void,
  ) => () => void
  onTick: (handler: () => void) => () => void
  setTickActive: (active: boolean) => Promise<{ success: boolean }>
}

export interface DesktopNamespace {
  /** True when foreground art-app / idle detection runs natively (Windows only). */
  activityTrackingNative: boolean
  syncSettings: (payload: Record<string, unknown>) => Promise<void>
  pickArtAppExecutable: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: unknown }>
  showTestNotification: (payload: { title: string; body: string }) => Promise<{ success: boolean }>
  setTaskbarProgress: (payload: {
    progress: number
    mode?: 'normal' | 'paused' | 'error' | 'none' | 'indeterminate'
  }) => Promise<{ success: boolean; error?: unknown }>
  applyWindowBounds: (bounds: {
    main?: { x: number; y: number; width: number; height: number }
    overlay?: { x: number; y: number }
    reference?: { x: number; y: number; width: number; height: number }
  }) => Promise<{ success: boolean; error?: unknown }>
  onWindowBoundsReport: (
    handler: (bounds: {
      main?: { x: number; y: number; width: number; height: number }
      overlay?: { x: number; y: number }
      reference?: { x: number; y: number; width: number; height: number }
    }) => void,
  ) => () => void
  onNavigate: (handler: (route: string) => void) => () => void
  trackTelemetry: (entry: Record<string, unknown>) => Promise<{ success: boolean }>
}

export interface ElectronAPI {
  progress: ProgressNamespace
  shell: ShellNamespace
  overlay: OverlayNamespace
  reference: ReferenceNamespace
  cloud: CloudNamespace
  gallery: GalleryNamespace
  session: SessionNamespace
  desktop: DesktopNamespace
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
