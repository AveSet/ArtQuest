import { useEffect, useState } from 'react'
import type { VideoResource } from '@/data/videoResources'
import { getCoreVideoCatalog, loadExtendedVideoCatalog } from '@/utils/loadVideoCatalog'

export function useVideoCatalog(loadExtended = false): {
  catalog: VideoResource[] | null
  catalogError: boolean
  catalogLoading: boolean
  catalogExtendedLoading: boolean
} {
  const [catalog, setCatalog] = useState<VideoResource[] | null>(() => [...getCoreVideoCatalog()])
  const [catalogExtendedReady, setCatalogExtendedReady] = useState(!loadExtended)
  const [catalogError, setCatalogError] = useState(false)

  useEffect(() => {
    if (!loadExtended) {
      setCatalog([...getCoreVideoCatalog()])
      setCatalogExtendedReady(true)
      setCatalogError(false)
      return
    }

    let cancelled = false
    setCatalogError(false)
    setCatalogExtendedReady(false)

    loadExtendedVideoCatalog()
      .then((list) => {
        if (!cancelled) {
          setCatalog(list)
          setCatalogExtendedReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true)
      })

    return () => {
      cancelled = true
    }
  }, [loadExtended])

  return {
    catalog,
    catalogError,
    catalogLoading: catalog === null && !catalogError,
    catalogExtendedLoading: loadExtended && catalog !== null && !catalogExtendedReady && !catalogError,
  }
}
