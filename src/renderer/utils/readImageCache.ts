/** LRU-style cache for disk-backed gallery media (images via readImage, videos via getLocalMediaUrl). */

import { mediaKindFromPath } from '@/utils/mediaKind'

const MAX_KEYS = 96
const inFlight = new Map<string, Promise<string | null>>()
const order: string[] = []

function touch(key: string) {
  const i = order.indexOf(key)
  if (i >= 0) order.splice(i, 1)
  order.push(key)
  while (order.length > MAX_KEYS) {
    const oldest = order.shift()
    if (oldest) inFlight.delete(oldest)
  }
}

function readCached(
  savedPath: string,
  loader: (savedPath: string) => Promise<string | null>,
): Promise<string | null> {
  if (!savedPath) return Promise.resolve(null)

  let p = inFlight.get(savedPath)
  if (!p) {
    p = loader(savedPath)
      .then((url) => url)
      .catch(() => {
        inFlight.delete(savedPath)
        const i = order.indexOf(savedPath)
        if (i >= 0) order.splice(i, 1)
        return null
      })
    inFlight.set(savedPath, p)
  }
  touch(savedPath)
  return p
}

/** Load image from disk as a data URL (Electron `read-image`). */
export function readImageCached(savedPath: string): Promise<string | null> {
  const api = window.electronAPI?.readImage
  if (!api) return Promise.resolve(null)
  return readCached(savedPath, api)
}

/** Load local file as a `file://` URL (Electron `get-local-media-url`). */
export function readLocalMediaUrlCached(savedPath: string): Promise<string | null> {
  const api = window.electronAPI?.getLocalMediaUrl
  if (!api) return Promise.resolve(null)
  return readCached(savedPath, api)
}

/** Pick the correct IPC loader — prefer `file://` URLs over base64 for disk-backed media. */
export function readSavedMediaCached(savedPath: string): Promise<string | null> {
  if (!savedPath) return Promise.resolve(null)
  if (mediaKindFromPath(savedPath) === 'video') {
    return readLocalMediaUrlCached(savedPath)
  }
  if (window.electronAPI?.getLocalMediaUrl) {
    return readLocalMediaUrlCached(savedPath)
  }
  return readImageCached(savedPath)
}

export function invalidateReadImageCache(savedPath?: string): void {
  if (savedPath) {
    inFlight.delete(savedPath)
    const i = order.indexOf(savedPath)
    if (i >= 0) order.splice(i, 1)
    return
  }
  inFlight.clear()
  order.length = 0
}
