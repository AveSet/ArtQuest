import type { ElectronAPI } from '@/types/electron.d'
import type { Settings } from '@/store/models'

type WindowBoundsPartial = NonNullable<Settings['windowBounds']>

type FlatElectronExtras = {
  isDesktop?: boolean
  loadProgress?: () => Promise<unknown>
  showItemInFolder?: (filePath: string) => Promise<void>
  openReferenceWindow?: (params: unknown) => Promise<{ success: boolean; error?: unknown }>
  openSessionOverlay?: (opts?: { hideMain?: boolean }) => Promise<{ success: boolean; error?: unknown }>
  getStorageMode?: () => Promise<{ success: boolean; mode?: string; error?: unknown }>
  setStorageMode?: (mode: string) => Promise<{ success: boolean; mode?: string; error?: unknown }>
  connectGoogleDrive?: () => Promise<{ success: boolean; account?: unknown; error?: string }>
  disconnectGoogleDrive?: () => Promise<{ success: boolean; account?: unknown; error?: string }>
  setGoogleDrivePath?: (path: string) => Promise<{ success: boolean; account?: unknown; error?: string }>
  getGoogleDriveStatus?: () => Promise<{
    success: boolean
    account?: unknown
    lastUploadError?: string | null
    needsScopeReconnect?: boolean
    folderWebUrl?: string | null
    error?: string
  }>
  syncGallery?: () => Promise<{ success: boolean; error?: string; needsScopeReconnect?: boolean; lastError?: string }>
  onGallerySyncUpdated?: (cb: () => void) => () => void
  getSavedImages?: () => Promise<unknown[]>
  applyWindowBounds?: (bounds: WindowBoundsPartial) => Promise<{ success: boolean; error?: unknown }>
  onWindowBoundsReport?: (handler: (partial: WindowBoundsPartial) => void) => () => void
  showTestNotification?: (payload: { title: string; body: string }) => Promise<{ success: boolean }>
}

type ElectronSurface = (ElectronAPI & FlatElectronExtras) | undefined

function readElectronVersion(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const proc = (window as Window & { process?: { versions?: { electron?: string } } }).process
  return proc?.versions?.electron
}

export function getElectronAPI(): ElectronSurface {
  return typeof window !== 'undefined' ? window.electronAPI : undefined
}

/** True when running inside Electron with preload API (matches dist-build-2026-06-28 gating). */
export function isElectronDesktop(): boolean {
  if (typeof window === 'undefined') return false
  if (getElectronAPI()) return true
  return Boolean(readElectronVersion())
}

export async function showItemInFolder(filePath: string): Promise<void> {
  const api = getElectronAPI()
  if (!api || !filePath) return
  const fn = api.shell?.showItemInFolder ?? (api as FlatElectronExtras).showItemInFolder
  if (fn) await fn(filePath)
}

export async function openReferenceWindowIpc(
  params: unknown,
): Promise<{ success: boolean; error?: unknown } | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.reference?.open ?? (api as FlatElectronExtras).openReferenceWindow
  if (!fn) return undefined
  return fn(params)
}

export async function openSessionOverlayIpc(
  opts?: { hideMain?: boolean },
): Promise<{ success: boolean; error?: unknown } | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.overlay?.open ?? (api as FlatElectronExtras).openSessionOverlay
  if (!fn) return undefined
  return fn(opts)
}

export async function getStorageModeIpc(): Promise<{
  success: boolean
  mode?: string
  error?: unknown
} | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.getMode ?? (api as FlatElectronExtras).getStorageMode
  if (!fn) return undefined
  return fn()
}

export async function setStorageModeIpc(
  mode: string,
): Promise<{ success: boolean; mode?: string; error?: unknown } | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.setMode ?? (api as FlatElectronExtras).setStorageMode
  if (!fn) return undefined
  return fn(mode)
}

export async function getGoogleDriveStatusIpc(): Promise<
  ReturnType<NonNullable<FlatElectronExtras['getGoogleDriveStatus']>> | undefined
> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.getGoogleDriveStatus ?? (api as FlatElectronExtras).getGoogleDriveStatus
  if (!fn) return undefined
  return fn()
}

export async function connectGoogleDriveIpc(): Promise<
  ReturnType<NonNullable<FlatElectronExtras['connectGoogleDrive']>> | undefined
> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.connectGoogleDrive ?? (api as FlatElectronExtras).connectGoogleDrive
  if (!fn) return undefined
  return fn()
}

export async function disconnectGoogleDriveIpc(): Promise<
  ReturnType<NonNullable<FlatElectronExtras['disconnectGoogleDrive']>> | undefined
> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.disconnectGoogleDrive ?? (api as FlatElectronExtras).disconnectGoogleDrive
  if (!fn) return undefined
  return fn()
}

export async function setGoogleDrivePathIpc(
  remoteRootPath: string,
): Promise<ReturnType<NonNullable<FlatElectronExtras['setGoogleDrivePath']>> | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.cloud?.setGoogleDrivePath ?? (api as FlatElectronExtras).setGoogleDrivePath
  if (!fn) return undefined
  return fn(remoteRootPath)
}

export async function syncGalleryIpc(): Promise<
  ReturnType<NonNullable<FlatElectronExtras['syncGallery']>> | undefined
> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.gallery?.sync ?? (api as FlatElectronExtras).syncGallery
  if (!fn) return undefined
  return fn()
}

export async function listGalleryImagesIpc(): Promise<unknown[] | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.gallery?.listImages ?? (api as FlatElectronExtras).getSavedImages
  if (!fn) return undefined
  return fn()
}

export function subscribeGallerySyncUpdated(cb: () => void): (() => void) | undefined {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.gallery?.onSyncUpdated ?? (api as FlatElectronExtras).onGallerySyncUpdated
  if (!fn) return undefined
  return fn(cb)
}

export function subscribeWindowBoundsReport(
  handler: (partial: WindowBoundsPartial) => void,
): (() => void) | undefined {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.desktop?.onWindowBoundsReport ?? (api as FlatElectronExtras).onWindowBoundsReport
  if (!fn) return undefined
  return fn(handler)
}

export function applyWindowBoundsIpc(bounds: WindowBoundsPartial): void {
  const api = getElectronAPI()
  if (!api || (!bounds.main && !bounds.overlay && !bounds.reference)) return
  const fn = api.desktop?.applyWindowBounds ?? (api as FlatElectronExtras).applyWindowBounds
  if (fn) void fn(bounds)
}

export async function showTestNotificationIpc(payload: {
  title: string
  body: string
}): Promise<{ success: boolean } | undefined> {
  const api = getElectronAPI()
  if (!api) return undefined
  const fn = api.desktop?.showTestNotification ?? (api as FlatElectronExtras).showTestNotification
  if (!fn) return undefined
  return fn(payload)
}

export async function openExternalIpc(url: string): Promise<void> {
  const api = getElectronAPI()
  if (!api || !url) return
  const fn = api.shell?.openExternal ?? (api as FlatElectronExtras & { openExternal?: (url: string) => Promise<void> }).openExternal
  if (fn) await fn(url)
}
