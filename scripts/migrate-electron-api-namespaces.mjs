#!/usr/bin/env node
/**
 * One-shot migration: flat window.electronAPI.* -> namespaced surfaces.
 * Safe to re-run (idempotent for already-migrated paths).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const REPLACEMENTS = [
  ['electronAPI?.saveProgress', 'electronAPI?.progress?.save'],
  ['electronAPI.saveProgress', 'electronAPI.progress.save'],
  ['electronAPI?.saveProgressSync', 'electronAPI?.progress?.saveSync'],
  ['electronAPI.saveProgressSync', 'electronAPI.progress.saveSync'],
  ['electronAPI?.loadProgress', 'electronAPI?.progress?.load'],
  ['electronAPI.loadProgress', 'electronAPI.progress.load'],
  ['electronAPI?.readCorruptProgressBackup', 'electronAPI?.progress?.readCorruptBackup'],
  ['electronAPI.readCorruptProgressBackup', 'electronAPI.progress.readCorruptBackup'],
  ['electronAPI?.clearProgress', 'electronAPI?.progress?.clear'],
  ['electronAPI.clearProgress', 'electronAPI.progress.clear'],
  ['electronAPI?.exportProgressFile', 'electronAPI?.progress?.exportFile'],
  ['electronAPI.exportProgressFile', 'electronAPI.progress.exportFile'],
  ['electronAPI?.importProgressFile', 'electronAPI?.progress?.importFile'],
  ['electronAPI.importProgressFile', 'electronAPI.progress.importFile'],
  ['electronAPI?.appendCompletionLog', 'electronAPI?.progress?.appendLog'],
  ['electronAPI.appendCompletionLog', 'electronAPI.progress.appendLog'],
  ['electronAPI?.onAppBeforeQuit', 'electronAPI?.progress?.onBeforeQuit'],
  ['electronAPI.onAppBeforeQuit', 'electronAPI.progress.onBeforeQuit'],
  ['electronAPI?.showItemInFolder', 'electronAPI?.shell?.showItemInFolder'],
  ['electronAPI.showItemInFolder', 'electronAPI.shell.showItemInFolder'],
  ['electronAPI?.openExternal', 'electronAPI?.shell?.openExternal'],
  ['electronAPI.openExternal', 'electronAPI.shell.openExternal'],
  ['electronAPI?.saveShareCardPng', 'electronAPI?.shell?.saveShareCardPng'],
  ['electronAPI.saveShareCardPng', 'electronAPI.shell.saveShareCardPng'],
  ['electronAPI?.saveImage', 'electronAPI?.gallery?.saveImage'],
  ['electronAPI.saveImage', 'electronAPI.gallery.saveImage'],
  ['electronAPI?.saveQuestReference', 'electronAPI?.gallery?.saveQuestReference'],
  ['electronAPI.saveQuestReference', 'electronAPI.gallery.saveQuestReference'],
  ['electronAPI?.deleteQuestReference', 'electronAPI?.gallery?.deleteQuestReference'],
  ['electronAPI.deleteQuestReference', 'electronAPI.gallery.deleteQuestReference'],
  ['electronAPI?.getSavedImages', 'electronAPI?.gallery?.listImages'],
  ['electronAPI.getSavedImages', 'electronAPI.gallery.listImages'],
  ['electronAPI?.readImage', 'electronAPI?.gallery?.readImage'],
  ['electronAPI.readImage', 'electronAPI.gallery.readImage'],
  ['electronAPI?.getLocalMediaUrl', 'electronAPI?.gallery?.getLocalMediaUrl'],
  ['electronAPI.getLocalMediaUrl', 'electronAPI.gallery.getLocalMediaUrl'],
  ['electronAPI?.pickPortraitImage', 'electronAPI?.gallery?.pickPortraitImage'],
  ['electronAPI.pickPortraitImage', 'electronAPI.gallery.pickPortraitImage'],
  ['electronAPI?.saveCustomAvatar', 'electronAPI?.gallery?.saveCustomAvatar'],
  ['electronAPI.saveCustomAvatar', 'electronAPI.gallery.saveCustomAvatar'],
  ['electronAPI?.retryGalleryUpload', 'electronAPI?.gallery?.retryUpload'],
  ['electronAPI.retryGalleryUpload', 'electronAPI.gallery.retryUpload'],
  ['electronAPI?.retryAllGalleryUploads', 'electronAPI?.gallery?.retryAllUploads'],
  ['electronAPI.retryAllGalleryUploads', 'electronAPI.gallery.retryAllUploads'],
  ['electronAPI?.syncGallery', 'electronAPI?.gallery?.sync'],
  ['electronAPI.syncGallery', 'electronAPI.gallery.sync'],
  ['electronAPI?.onGallerySyncUpdated', 'electronAPI?.gallery?.onSyncUpdated'],
  ['electronAPI.onGallerySyncUpdated', 'electronAPI.gallery.onSyncUpdated'],
  ['electronAPI?.getStorageMode', 'electronAPI?.cloud?.getMode'],
  ['electronAPI.getStorageMode', 'electronAPI.cloud.getMode'],
  ['electronAPI?.setStorageMode', 'electronAPI?.cloud?.setMode'],
  ['electronAPI.setStorageMode', 'electronAPI.cloud.setMode'],
  ['electronAPI?.connectGoogleDrive', 'electronAPI?.cloud?.connectGoogleDrive'],
  ['electronAPI.connectGoogleDrive', 'electronAPI.cloud.connectGoogleDrive'],
  ['electronAPI?.disconnectGoogleDrive', 'electronAPI?.cloud?.disconnectGoogleDrive'],
  ['electronAPI.disconnectGoogleDrive', 'electronAPI.cloud.disconnectGoogleDrive'],
  ['electronAPI?.setGoogleDrivePath', 'electronAPI?.cloud?.setGoogleDrivePath'],
  ['electronAPI.setGoogleDrivePath', 'electronAPI.cloud.setGoogleDrivePath'],
  ['electronAPI?.getGoogleDriveStatus', 'electronAPI?.cloud?.getGoogleDriveStatus'],
  ['electronAPI.getGoogleDriveStatus', 'electronAPI.cloud.getGoogleDriveStatus'],
  ['electronAPI?.syncDesktopSettings', 'electronAPI?.desktop?.syncSettings'],
  ['electronAPI.syncDesktopSettings', 'electronAPI.desktop.syncSettings'],
  ['electronAPI?.pickArtAppExecutable', 'electronAPI?.desktop?.pickArtAppExecutable'],
  ['electronAPI.pickArtAppExecutable', 'electronAPI.desktop.pickArtAppExecutable'],
  ['electronAPI?.showTestNotification', 'electronAPI?.desktop?.showTestNotification'],
  ['electronAPI.showTestNotification', 'electronAPI.desktop.showTestNotification'],
  ['electronAPI?.setTaskbarProgress', 'electronAPI?.desktop?.setTaskbarProgress'],
  ['electronAPI.setTaskbarProgress', 'electronAPI.desktop.setTaskbarProgress'],
  ['electronAPI?.applyWindowBounds', 'electronAPI?.desktop?.applyWindowBounds'],
  ['electronAPI.applyWindowBounds', 'electronAPI.desktop.applyWindowBounds'],
  ['electronAPI?.onWindowBoundsReport', 'electronAPI?.desktop?.onWindowBoundsReport'],
  ['electronAPI.onWindowBoundsReport', 'electronAPI.desktop.onWindowBoundsReport'],
  ['electronAPI?.onNavigate', 'electronAPI?.desktop?.onNavigate'],
  ['electronAPI.onNavigate', 'electronAPI.desktop.onNavigate'],
  ['electronAPI?.trackTelemetry', 'electronAPI?.desktop?.trackTelemetry'],
  ['electronAPI.trackTelemetry', 'electronAPI.desktop.trackTelemetry'],
  ['electronAPI?.activityTrackingNative', 'electronAPI?.desktop?.activityTrackingNative'],
  ['electronAPI.activityTrackingNative', 'electronAPI.desktop.activityTrackingNative'],
  ['electronAPI?.dispatchQuestSessionCommand', 'electronAPI?.session?.dispatchCommand'],
  ['electronAPI.dispatchQuestSessionCommand', 'electronAPI.session.dispatchCommand'],
  ['electronAPI?.onQuestSessionCommand', 'electronAPI?.session?.onCommand'],
  ['electronAPI.onQuestSessionCommand', 'electronAPI.session.onCommand'],
  ['electronAPI?.onActivityUpdate', 'electronAPI?.session?.onActivityUpdate'],
  ['electronAPI.onActivityUpdate', 'electronAPI.session.onActivityUpdate'],
  ['electronAPI?.onSessionTick', 'electronAPI?.session?.onTick'],
  ['electronAPI.onSessionTick', 'electronAPI.session.onTick'],
  ['electronAPI?.setSessionTickActive', 'electronAPI?.session?.setTickActive'],
  ['electronAPI.setSessionTickActive', 'electronAPI.session.setTickActive'],
  ['electronAPI?.setQuestOverlayPayload', 'electronAPI?.overlay?.setPayload'],
  ['electronAPI.setQuestOverlayPayload', 'electronAPI.overlay.setPayload'],
  ['electronAPI?.setQuestOverlayPatch', 'electronAPI?.overlay?.setPatch'],
  ['electronAPI.setQuestOverlayPatch', 'electronAPI.overlay.setPatch'],
  ['electronAPI?.setOverlayLayout', 'electronAPI?.overlay?.setLayout'],
  ['electronAPI.setOverlayLayout', 'electronAPI.overlay.setLayout'],
  ['electronAPI?.setSessionOverlayActive', 'electronAPI?.overlay?.setSessionActive'],
  ['electronAPI.setSessionOverlayActive', 'electronAPI.overlay.setSessionActive'],
  ['electronAPI?.openSessionOverlay', 'electronAPI?.overlay?.open'],
  ['electronAPI.openSessionOverlay', 'electronAPI.overlay.open'],
  ['electronAPI?.hideSessionOverlay', 'electronAPI?.overlay?.hide'],
  ['electronAPI.hideSessionOverlay', 'electronAPI.overlay.hide'],
  ['electronAPI?.toggleQuestOverlay', 'electronAPI?.overlay?.toggle'],
  ['electronAPI.toggleQuestOverlay', 'electronAPI.overlay.toggle'],
  ['electronAPI?.expandQuestOverlay', 'electronAPI?.overlay?.expand'],
  ['electronAPI.expandQuestOverlay', 'electronAPI.overlay.expand'],
  ['electronAPI?.cancelQuestOverlay', 'electronAPI?.overlay?.cancel'],
  ['electronAPI.cancelQuestOverlay', 'electronAPI.overlay.cancel'],
  ['electronAPI?.closeQuestOverlay', 'electronAPI?.overlay?.close'],
  ['electronAPI.closeQuestOverlay', 'electronAPI.overlay.close'],
  ['electronAPI?.getQuestOverlaySnapshot', 'electronAPI?.overlay?.getSnapshot'],
  ['electronAPI.getQuestOverlaySnapshot', 'electronAPI.overlay.getSnapshot'],
  ['electronAPI?.getQuestOverlayPayload', 'electronAPI?.overlay?.getPayload'],
  ['electronAPI.getQuestOverlayPayload', 'electronAPI.overlay.getPayload'],
  ['electronAPI?.notifyOverlayReady', 'electronAPI?.overlay?.notifyReady'],
  ['electronAPI.notifyOverlayReady', 'electronAPI.overlay.notifyReady'],
  ['electronAPI?.onOverlayRequestSync', 'electronAPI?.overlay?.onRequestSync'],
  ['electronAPI.onOverlayRequestSync', 'electronAPI.overlay.onRequestSync'],
  ['electronAPI?.onQuestOverlayUpdate', 'electronAPI?.overlay?.onUpdate'],
  ['electronAPI.onQuestOverlayUpdate', 'electronAPI.overlay.onUpdate'],
  ['electronAPI?.onQuestOverlayPatch', 'electronAPI?.overlay?.onPatch'],
  ['electronAPI.onQuestOverlayPatch', 'electronAPI.overlay.onPatch'],
  ['electronAPI?.openReferenceWindow', 'electronAPI?.reference?.open'],
  ['electronAPI.openReferenceWindow', 'electronAPI.reference.open'],
  ['electronAPI?.openUrlInReferenceWindow', 'electronAPI?.reference?.navigate'],
  ['electronAPI.openUrlInReferenceWindow', 'electronAPI.reference.navigate'],
  ['electronAPI?.onReferenceWindowNavigate', 'electronAPI?.reference?.onNavigate'],
  ['electronAPI.onReferenceWindowNavigate', 'electronAPI.reference.onNavigate'],
  ["['setQuestOverlayPayload']", "['overlay']['setPayload']"],
  ['api?.saveProgress', 'api?.progress?.save'],
  ['api?.saveProgressSync', 'api?.progress?.saveSync'],
  ['api?.saveImage', 'api?.gallery?.saveImage'],
  ['api?.saveQuestReference', 'api?.gallery?.saveQuestReference'],
  ['api?.syncDesktopSettings', 'api?.desktop?.syncSettings'],
  ['api?.saveShareCardPng', 'api?.shell?.saveShareCardPng'],
  ['api?.setQuestOverlayPayload', 'api?.overlay?.setPayload'],
  ['api.setQuestOverlayPayload', 'api.overlay.setPayload'],
  ['api?.setQuestOverlayPatch', 'api?.overlay?.setPatch'],
  ['api.setQuestOverlayPatch', 'api.overlay.setPatch'],
  ['api?.setSessionOverlayActive', 'api?.overlay?.setSessionActive'],
  ['api.setSessionOverlayActive', 'api.overlay.setSessionActive'],
  ['api?.openSessionOverlay', 'api?.overlay?.open'],
  ['api.openSessionOverlay', 'api.overlay.open'],
  ['api?.showTestNotification', 'api?.desktop?.showTestNotification'],
  ['api.showTestNotification', 'api.desktop.showTestNotification'],
  ['api?.saveQuestReference', 'api?.gallery?.saveQuestReference'],
  ['api.saveQuestReference', 'api.gallery.saveQuestReference'],
  ['api?.hideSessionOverlay', 'api?.overlay?.hide'],
  ['api?.setTaskbarProgress', 'api?.desktop?.setTaskbarProgress'],
]

const SCAN_DIRS = ['src', 'e2e', 'e2e-electron']

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'electron.d.ts') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full)
  }
  return out
}

let changed = 0
for (const dir of SCAN_DIRS) {
  const base = path.join(ROOT, dir)
  if (!fs.existsSync(base)) continue
  for (const file of walk(base)) {
    if (file.includes('migrate-electron-api-namespaces')) continue
    if (file.includes('exposeElectronApi.ts')) continue
    let text = fs.readFileSync(file, 'utf8')
    const before = text
    for (const [from, to] of REPLACEMENTS) {
      text = text.split(from).join(to)
    }
    if (text !== before) {
      fs.writeFileSync(file, text)
      changed++
      console.log('updated', path.relative(ROOT, file))
    }
  }
}
console.log(`Done. ${changed} files updated.`)
