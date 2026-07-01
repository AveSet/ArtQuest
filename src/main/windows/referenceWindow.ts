import { BrowserWindow, screen } from 'electron'
import { appState } from '../app/appState'
import { applyAppDocumentCsp, hardenReferenceWebviewContents } from '../windowSecurity'
import { createRendererWebPreferences } from './rendererWebPreferences'
import { resolvePreloadPath } from './iconAssets'
import { loadRendererRoute } from './loadRendererRoute'
import { reportWindowBoundsToRenderer } from './windowBoundsState'
import { clampWindowPoint, isFiniteRect } from '../ipc/windowBoundsHandlers'

export type ReferenceWindowOpenParams = {
  mode?: string
  questId?: number
  nodeId?: string
  category?: string
  tags?: string[]
  lang?: string
  source?: string
}

export function buildReferenceMaterialsRoute(params: ReferenceWindowOpenParams): string {
  const p = new URLSearchParams()
  if (params.mode) p.set('mode', params.mode)
  if (params.questId != null) p.set('questId', String(params.questId))
  if (params.nodeId) p.set('node', params.nodeId)
  if (params.category) p.set('category', params.category)
  if (params.tags?.length) p.set('tags', params.tags.join(','))
  if (params.lang) p.set('lang', params.lang)
  if (params.source) p.set('source', params.source)
  const qs = p.toString()
  return `/reference-materials${qs ? `?${qs}` : ''}`
}

function getReferenceWindowSize(): { width: number; height: number } {
  const { width: workW, height: workH } = screen.getPrimaryDisplay().workAreaSize
  return {
    width: Math.min(Math.max(640, Math.round(workW * 0.82)), workW - 24),
    height: Math.min(Math.max(480, Math.round(workH * 0.85)), workH - 24),
  }
}

export function createReferenceWindow(params: ReferenceWindowOpenParams): BrowserWindow {
  const refSize = getReferenceWindowSize()
  const saved = appState.persistedWindowBounds.reference
  if (appState.referenceWindow && !appState.referenceWindow.isDestroyed()) {
    loadRendererRoute(appState.referenceWindow, buildReferenceMaterialsRoute(params))
    appState.referenceWindow.show()
    appState.referenceWindow.focus()
    return appState.referenceWindow
  }

  const initialBounds = isFiniteRect(saved) ? saved : { ...refSize, x: 0, y: 0 }
  const positioned = isFiniteRect(saved)
    ? clampWindowPoint({ x: saved.x, y: saved.y }, saved.width, saved.height)
    : null

  appState.referenceWindow = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    x: positioned?.x,
    y: positioned?.y,
    center: !positioned,
    minWidth: 640,
    minHeight: 480,
    show: false,
    title: 'ArtQuest — Materials',
    webPreferences: createRendererWebPreferences({
      preloadPath: resolvePreloadPath('overlay'),
      webviewTag: true,
    }),
  })
  applyAppDocumentCsp(appState.referenceWindow.webContents.session)
  hardenReferenceWebviewContents(appState.referenceWindow.webContents)
  const reportReferenceBounds = () => {
    if (!appState.referenceWindow || appState.referenceWindow.isDestroyed()) return
    const b = appState.referenceWindow.getBounds()
    reportWindowBoundsToRenderer({
      reference: { x: b.x, y: b.y, width: b.width, height: b.height },
    })
  }
  appState.referenceWindow.on('close', reportReferenceBounds)
  appState.referenceWindow.on('closed', () => {
    appState.referenceWindow = null
  })
  appState.referenceWindow.on('moved', reportReferenceBounds)
  appState.referenceWindow.on('resized', reportReferenceBounds)
  appState.referenceWindow.once('ready-to-show', () => appState.referenceWindow?.show())
  loadRendererRoute(appState.referenceWindow, buildReferenceMaterialsRoute(params))
  return appState.referenceWindow
}

export function openUrlInReferenceWebview(url: string): void {
  if (!appState.referenceWindow || appState.referenceWindow.isDestroyed()) return
  appState.referenceWindow.webContents.send('artquest:v1:reference-window:navigate', url)
}
