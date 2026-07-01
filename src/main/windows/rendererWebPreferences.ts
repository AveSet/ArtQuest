import type { WebPreferences } from 'electron'

export type RendererWebPreferencesOptions = {
  preloadPath: string
  backgroundThrottling?: boolean
  webviewTag?: boolean
}

/** Shared hardened webPreferences for renderer windows (main, overlay, reference). */
export function createRendererWebPreferences(options: RendererWebPreferencesOptions): WebPreferences {
  return {
    preload: options.preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    backgroundThrottling: options.backgroundThrottling ?? false,
    ...(options.webviewTag ? { webviewTag: true } : {}),
  }
}
