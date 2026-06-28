import { CORE_VIDEO_RESOURCES, type VideoResource } from '@/data/videoResources'

let fullCached: VideoResource[] | null = null
let extendedPromise: Promise<VideoResource[]> | null = null

/** Core Materials catalog — small, available immediately. */
export function getCoreVideoCatalog(): readonly VideoResource[] {
  return CORE_VIDEO_RESOURCES
}

/** Lazy-loads auto-curated YouTube rows and merges with core. */
export function loadExtendedVideoCatalog(): Promise<VideoResource[]> {
  if (fullCached) return Promise.resolve(fullCached)
  if (!extendedPromise) {
    extendedPromise = import('@/data/videoResourcesCurated')
      .then((m) => m.buildExtendedVideoCatalog())
      .then((extended) => {
        fullCached = [...CORE_VIDEO_RESOURCES, ...extended]
        return fullCached
      })
      .catch((err) => {
        extendedPromise = null
        throw err
      })
  }
  return extendedPromise
}

/** Full catalog (core + extended). Prefer getCoreVideoCatalog + loadExtendedVideoCatalog for faster UI. */
export function loadVideoCatalog(): Promise<VideoResource[]> {
  return loadExtendedVideoCatalog()
}

/** Test / dev helper — reset cached catalog. */
export function resetVideoCatalogCache(): void {
  fullCached = null
  extendedPromise = null
}
