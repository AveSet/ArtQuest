import type { ProgressApi } from './namespaces/progress'
import type { ShellApi } from './namespaces/shell'
import type { OverlayApi } from './namespaces/overlay'
import type { ReferenceApi } from './namespaces/reference'
import type { CloudApi } from './namespaces/cloud'
import type { GalleryApi } from './namespaces/gallery'
import type { SessionApi } from './namespaces/session'
import type { DesktopApi } from './namespaces/desktop'

export type NamespacedElectronApis = {
  progress: ProgressApi
  shell: ShellApi
  overlay: OverlayApi
  reference: ReferenceApi
  cloud: CloudApi
  gallery: GalleryApi
  session: SessionApi
  desktop: DesktopApi
}

/** Flat aliases matching dist-build-2026-06-28 preload surface (top-level factory names). */
export function buildLegacyElectronApiShim(apis: NamespacedElectronApis): Record<string, unknown> {
  const { progress, shell, overlay, reference, cloud, gallery, session, desktop } = apis
  return {
    isDesktop: true,
    saveProgress: progress.saveProgress,
    saveProgressSync: progress.saveProgressSync,
    loadProgress: progress.loadProgress,
    readCorruptProgressBackup: progress.readCorruptProgressBackup,
    clearProgress: progress.clearProgress,
    exportProgressFile: progress.exportProgressFile,
    importProgressFile: progress.importProgressFile,
    appendCompletionLog: progress.appendCompletionLog,
    onAppBeforeQuit: progress.onAppBeforeQuit,
    showItemInFolder: shell.showItemInFolder,
    openExternal: shell.openExternal,
    saveShareCardPng: shell.saveShareCardPng,
    saveImage: gallery.saveImage,
    saveQuestReference: gallery.saveQuestReference,
    deleteQuestReference: gallery.deleteQuestReference,
    getSavedImages: gallery.getSavedImages,
    readImage: gallery.readImage,
    getLocalMediaUrl: gallery.getLocalMediaUrl,
    pickPortraitImage: gallery.pickPortraitImage,
    saveCustomAvatar: gallery.saveCustomAvatar,
    retryGalleryUpload: gallery.retryGalleryUpload,
    retryAllGalleryUploads: gallery.retryAllGalleryUploads,
    syncGallery: gallery.syncGallery,
    onGallerySyncUpdated: gallery.onGallerySyncUpdated,
    getStorageMode: cloud.getStorageMode,
    setStorageMode: cloud.setStorageMode,
    connectGoogleDrive: cloud.connectGoogleDrive,
    disconnectGoogleDrive: cloud.disconnectGoogleDrive,
    setGoogleDrivePath: cloud.setGoogleDrivePath,
    getGoogleDriveStatus: cloud.getGoogleDriveStatus,
    syncDesktopSettings: desktop.syncDesktopSettings,
    pickArtAppExecutable: desktop.pickArtAppExecutable,
    showTestNotification: desktop.showTestNotification,
    setTaskbarProgress: desktop.setTaskbarProgress,
    applyWindowBounds: desktop.applyWindowBounds,
    onWindowBoundsReport: desktop.onWindowBoundsReport,
    onNavigate: desktop.onNavigate,
    trackTelemetry: desktop.trackTelemetry,
    activityTrackingNative: desktop.activityTrackingNative,
    dispatchQuestSessionCommand: session.dispatchQuestSessionCommand,
    onQuestSessionCommand: session.onQuestSessionCommand,
    onActivityUpdate: session.onActivityUpdate,
    onSessionTick: session.onSessionTick,
    setSessionTickActive: session.setSessionTickActive,
    setQuestOverlayPayload: overlay.setQuestOverlayPayload,
    setQuestOverlayPatch: overlay.setQuestOverlayPatch,
    setOverlayLayout: overlay.setOverlayLayout,
    setSessionOverlayActive: overlay.setSessionOverlayActive,
    openSessionOverlay: overlay.openSessionOverlay,
    hideSessionOverlay: overlay.hideSessionOverlay,
    toggleQuestOverlay: overlay.toggleQuestOverlay,
    expandQuestOverlay: overlay.expandQuestOverlay,
    cancelQuestOverlay: overlay.cancelQuestOverlay,
    closeQuestOverlay: overlay.closeQuestOverlay,
    getQuestOverlaySnapshot: overlay.getQuestOverlaySnapshot,
    getQuestOverlayPayload: overlay.getQuestOverlayPayload,
    notifyOverlayReady: overlay.notifyOverlayReady,
    onOverlayRequestSync: overlay.onOverlayRequestSync,
    onQuestOverlayUpdate: overlay.onQuestOverlayUpdate,
    onQuestOverlayPatch: overlay.onQuestOverlayPatch,
    openReferenceWindow: reference.openReferenceWindow,
    openUrlInReferenceWindow: reference.openUrlInReferenceWindow,
    onReferenceWindowNavigate: reference.onReferenceWindowNavigate,
  }
}

/** Required flat + namespaced keys for packaged smoke checks. */
export const REQUIRED_ELECTRON_API_KEYS = {
  flat: [
    'isDesktop',
    'loadProgress',
    'showItemInFolder',
    'getStorageMode',
    'openReferenceWindow',
    'openSessionOverlay',
    'getSavedImages',
    'applyWindowBounds',
  ],
  namespaced: [
    'progress.load',
    'shell.showItemInFolder',
    'cloud.getMode',
    'reference.open',
    'overlay.open',
    'gallery.listImages',
    'desktop.applyWindowBounds',
  ],
} as const

export function validateLegacyElectronApiShim(legacy: Record<string, unknown>): string[] {
  const missing: string[] = []
  for (const key of REQUIRED_ELECTRON_API_KEYS.flat) {
    if (typeof legacy[key] !== 'function' && key !== 'isDesktop') {
      missing.push(`flat.${key}`)
    }
  }
  if (legacy.isDesktop !== true) missing.push('flat.isDesktop')
  return missing
}
