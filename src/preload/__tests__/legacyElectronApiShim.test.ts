import { describe, it, expect } from 'vitest'
import {
  buildLegacyElectronApiShim,
  validateLegacyElectronApiShim,
} from '../legacyElectronApiShim'

function fn(label?: string) {
  const f = () => Promise.resolve()
  if (label) Object.defineProperty(f, 'name', { value: label })
  return f
}

function makeApis() {
  return {
    progress: {
      saveProgress: fn('saveProgress'),
      saveProgressSync: fn('saveProgressSync'),
      loadProgress: fn('loadProgress'),
      readCorruptProgressBackup: fn('readCorruptProgressBackup'),
      clearProgress: fn('clearProgress'),
      exportProgressFile: fn('exportProgressFile'),
      importProgressFile: fn('importProgressFile'),
      appendCompletionLog: fn('appendCompletionLog'),
      onAppBeforeQuit: fn('onAppBeforeQuit'),
      namespace: {},
    },
    shell: {
      showItemInFolder: fn('showItemInFolder'),
      openExternal: fn('openExternal'),
      saveShareCardPng: fn('saveShareCardPng'),
      namespace: {},
    },
    overlay: {
      setQuestOverlayPayload: fn('setQuestOverlayPayload'),
      setQuestOverlayPatch: fn('setQuestOverlayPatch'),
      setOverlayLayout: fn('setOverlayLayout'),
      setSessionOverlayActive: fn('setSessionOverlayActive'),
      openSessionOverlay: fn('openSessionOverlay'),
      hideSessionOverlay: fn('hideSessionOverlay'),
      toggleQuestOverlay: fn('toggleQuestOverlay'),
      expandQuestOverlay: fn('expandQuestOverlay'),
      cancelQuestOverlay: fn('cancelQuestOverlay'),
      closeQuestOverlay: fn('closeQuestOverlay'),
      getQuestOverlaySnapshot: fn('getQuestOverlaySnapshot'),
      getQuestOverlayPayload: fn('getQuestOverlayPayload'),
      notifyOverlayReady: fn('notifyOverlayReady'),
      onOverlayRequestSync: fn('onOverlayRequestSync'),
      onQuestOverlayUpdate: fn('onQuestOverlayUpdate'),
      onQuestOverlayPatch: fn('onQuestOverlayPatch'),
      namespace: { open: fn('overlay.namespace.open') },
    },
    reference: {
      openReferenceWindow: fn('openReferenceWindow'),
      openUrlInReferenceWindow: fn('openUrlInReferenceWindow'),
      onReferenceWindowNavigate: fn('onReferenceWindowNavigate'),
      namespace: { open: fn('reference.namespace.open') },
    },
    cloud: {
      getStorageMode: fn('getStorageMode'),
      setStorageMode: fn('setStorageMode'),
      connectGoogleDrive: fn('connectGoogleDrive'),
      disconnectGoogleDrive: fn('disconnectGoogleDrive'),
      setGoogleDrivePath: fn('setGoogleDrivePath'),
      getGoogleDriveStatus: fn('getGoogleDriveStatus'),
      namespace: { getMode: fn('cloud.namespace.getMode') },
    },
    gallery: {
      saveImage: fn('saveImage'),
      saveQuestReference: fn('saveQuestReference'),
      deleteQuestReference: fn('deleteQuestReference'),
      getSavedImages: fn('getSavedImages'),
      readImage: fn('readImage'),
      getLocalMediaUrl: fn('getLocalMediaUrl'),
      pickPortraitImage: fn('pickPortraitImage'),
      saveCustomAvatar: fn('saveCustomAvatar'),
      retryGalleryUpload: fn('retryGalleryUpload'),
      retryAllGalleryUploads: fn('retryAllGalleryUploads'),
      syncGallery: fn('syncGallery'),
      onGallerySyncUpdated: fn('onGallerySyncUpdated'),
      namespace: { listImages: fn('gallery.namespace.listImages') },
    },
    session: {
      dispatchQuestSessionCommand: fn('dispatchQuestSessionCommand'),
      onQuestSessionCommand: fn('onQuestSessionCommand'),
      onActivityUpdate: fn('onActivityUpdate'),
      onSessionTick: fn('onSessionTick'),
      setSessionTickActive: fn('setSessionTickActive'),
      namespace: { dispatchCommand: fn('session.namespace.dispatchCommand') },
    },
    desktop: {
      syncDesktopSettings: fn('syncDesktopSettings'),
      pickArtAppExecutable: fn('pickArtAppExecutable'),
      showTestNotification: fn('showTestNotification'),
      setTaskbarProgress: fn('setTaskbarProgress'),
      applyWindowBounds: fn('applyWindowBounds'),
      onWindowBoundsReport: fn('onWindowBoundsReport'),
      onNavigate: fn('onNavigate'),
      trackTelemetry: fn('trackTelemetry'),
      activityTrackingNative: true,
      namespace: { applyWindowBounds: fn('desktop.namespace.applyWindowBounds') },
    },
  }
}

describe('legacyElectronApiShim', () => {
  it('maps flat aliases to top-level factory methods, not namespace-only names', () => {
    const apis = makeApis()
    const legacy = buildLegacyElectronApiShim(apis as never)

    expect(legacy.getSavedImages).toBe(apis.gallery.getSavedImages)
    expect(legacy.getSavedImages).not.toBe(apis.gallery.namespace.listImages)
    expect(legacy.getStorageMode).toBe(apis.cloud.getStorageMode)
    expect(legacy.openSessionOverlay).toBe(apis.overlay.openSessionOverlay)
    expect(legacy.openReferenceWindow).toBe(apis.reference.openReferenceWindow)
    expect(legacy.syncGallery).toBe(apis.gallery.syncGallery)
    expect(legacy.retryGalleryUpload).toBe(apis.gallery.retryGalleryUpload)
  })

  it('passes validateLegacyElectronApiShim when all required flat keys exist', () => {
    const legacy = buildLegacyElectronApiShim(makeApis() as never)
    expect(validateLegacyElectronApiShim(legacy)).toEqual([])
  })
})
