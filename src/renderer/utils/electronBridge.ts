import type { ElectronAPI } from '@/types/electron.d'

type FlatElectronExtras = {
  isDesktop?: boolean
  showItemInFolder?: (filePath: string) => Promise<void>
  openReferenceWindow?: (params: unknown) => Promise<{ success: boolean; error?: unknown }>
  openSessionOverlay?: (opts?: { hideMain?: boolean }) => Promise<{ success: boolean; error?: unknown }>
  getStorageMode?: () => Promise<{ success: boolean; mode?: string; error?: unknown }>
  showTestNotification?: (payload: { title: string; body: string }) => Promise<{ success: boolean }>
}

type ElectronSurface = (ElectronAPI & FlatElectronExtras) | undefined

export function getElectronAPI(): ElectronSurface {
  return typeof window !== 'undefined' ? window.electronAPI : undefined
}

/** True when preload exposed a working desktop progress API. */
export function isElectronDesktop(): boolean {
  const api = getElectronAPI() as FlatElectronExtras | undefined
  if (!api) return false
  if (api.isDesktop === true) return true
  return typeof api.progress?.load === 'function'
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
