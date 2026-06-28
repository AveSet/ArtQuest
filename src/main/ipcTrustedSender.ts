import path from 'path'
import { fileURLToPath } from 'url'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { app, ipcMain } from 'electron'

/** IPC channels that touch FS, shell, cloud, or desktop integration. */
const PRIVILEGED_IPC_CHANNELS = new Set([
  'save-progress',
  'save-progress-sync',
  'load-progress',
  'read-corrupt-progress-backup',
  'clear-progress',
  'save-image',
  'save-quest-reference',
  'delete-quest-reference',
  'pick-portrait-image',
  'save-custom-avatar',
  'get-saved-images',
  'read-image',
  'get-local-media-url',
  'sync-desktop-settings',
  'show-test-notification',
  'artquest:v1:quest-session:dispatch-command',
  'artquest:v1:overlay:set-payload',
  'artquest:v1:overlay:set-patch',
  'artquest:v1:overlay:set-layout',
  'artquest:v1:overlay:set-session-active',
  'artquest:v1:overlay:open',
  'artquest:v1:overlay:hide',
  'artquest:v1:overlay:toggle',
  'artquest:v1:overlay:expand',
  'artquest:v1:overlay:cancel',
  'artquest:v1:overlay:close',
  'artquest:v1:reference-window:open',
  'artquest:v1:reference-window:navigate',
  'show-item-in-folder',
  'open-external',
  'artquest:v1:storage:getMode',
  'artquest:v1:storage:setMode',
  'artquest:v1:cloud:google:connect',
  'artquest:v1:cloud:google:disconnect',
  'artquest:v1:cloud:google:setPath',
  'artquest:v1:cloud:google:getStatus',
  'artquest:v1:gallery:retryUpload',
  'artquest:v1:gallery:retryAllUploads',
  'artquest:v1:gallery:sync',
  'export-progress-file',
  'import-progress-file',
  'pick-art-app-exe',
  'save-share-card-png',
  'app-before-quit-done',
  'artquest:v1:overlay:get-payload',
  'artquest:v1:overlay:ready',
  'artquest:v1:session:set-tick-active',
])

let trustedRendererRoots: string[] | null = null

function getTrustedRendererRoots(): string[] {
  if (trustedRendererRoots) return trustedRendererRoots
  const roots = new Set<string>()
  try {
    roots.add(path.normalize(app.getAppPath()))
  } catch {
    /* app not ready */
  }
  try {
    roots.add(path.normalize(process.cwd()))
  } catch {
    /* ignore */
  }
  trustedRendererRoots = [...roots]
  return trustedRendererRoots
}

function fileUrlToPathname(url: string): string | null {
  if (!url.startsWith('file://')) return null
  try {
    return path.normalize(decodeURIComponent(fileURLToPath(url)))
  } catch {
    return null
  }
}

export function isTrustedRendererUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('file://')) {
    const pathname = fileUrlToPathname(url)
    if (!pathname) return false
    const lower = pathname.toLowerCase()
    const looksLikeRenderer =
      lower.endsWith('index.html') ||
      lower.includes(`${path.sep}renderer${path.sep}`) ||
      lower.includes(`${path.sep}out${path.sep}renderer${path.sep}`)
    if (!looksLikeRenderer) return false
    return getTrustedRendererRoots().some((root) => pathname.startsWith(root))
  }
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) {
    try {
      const port = new URL(url).port
      return port === '5173' || port === '4173'
    } catch {
      return false
    }
  }
  return false
}

export function assertTrustedIpcSender(event: IpcMainEvent | IpcMainInvokeEvent): void {
  const frameUrl = event.senderFrame?.url
  const senderUrl = typeof event.sender?.getURL === 'function' ? event.sender.getURL() : ''
  const url = frameUrl || senderUrl
  if (!isTrustedRendererUrl(url)) {
    throw new Error(`Blocked IPC from untrusted renderer: ${url || '(empty)'}`)
  }
}

let guardsInstalled = false

/** Wrap ipcMain.handle/on so privileged channels reject non-app renderer origins. */
export function installIpcSenderGuards(): void {
  if (guardsInstalled) return
  guardsInstalled = true

  const originalHandle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = ((channel: string, listener: Parameters<typeof ipcMain.handle>[1]) => {
    return originalHandle(channel, async (event, ...args) => {
      if (PRIVILEGED_IPC_CHANNELS.has(channel)) {
        assertTrustedIpcSender(event)
      }
      return listener(event, ...args)
    })
  }) as typeof ipcMain.handle

  const originalOn = ipcMain.on.bind(ipcMain)
  ipcMain.on = ((channel: string, listener: Parameters<typeof ipcMain.on>[1]) => {
    return originalOn(channel, (event, ...args) => {
      if (PRIVILEGED_IPC_CHANNELS.has(channel)) {
        assertTrustedIpcSender(event)
      }
      return listener(event, ...args)
    })
  }) as typeof ipcMain.on
}
