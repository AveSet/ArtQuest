import { contextBridge } from 'electron'
import { createProgressApi } from './namespaces/progress'
import { createShellApi } from './namespaces/shell'
import { createOverlayApi, installOverlayPayloadCache } from './namespaces/overlay'
import { createReferenceApi } from './namespaces/reference'
import { createCloudApi } from './namespaces/cloud'
import { createGalleryApi } from './namespaces/gallery'
import { createSessionApi } from './namespaces/session'
import { createDesktopApi } from './namespaces/desktop'

export function exposeElectronApi(): void {
  installOverlayPayloadCache()

  const progress = createProgressApi()
  const shell = createShellApi()
  const overlay = createOverlayApi()
  const reference = createReferenceApi()
  const cloud = createCloudApi()
  const gallery = createGalleryApi()
  const session = createSessionApi()
  const desktop = createDesktopApi()

  contextBridge.exposeInMainWorld('electronAPI', {
    progress: progress.namespace,
    shell: shell.namespace,
    overlay: overlay.namespace,
    reference: reference.namespace,
    cloud: cloud.namespace,
    gallery: gallery.namespace,
    session: session.namespace,
    desktop: { ...desktop.namespace, activityTrackingNative: desktop.activityTrackingNative },
  })
}

export function exposeOverlayElectronApi(): void {
  installOverlayPayloadCache()
  const overlay = createOverlayApi()
  const session = createSessionApi()
  const reference = createReferenceApi()

  contextBridge.exposeInMainWorld('electronAPI', {
    overlay: overlay.namespace,
    session: session.namespace,
    reference: reference.namespace,
  })
}
