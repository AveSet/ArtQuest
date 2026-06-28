import { useQuestStore } from '@/store/useQuestStore'
import { readSavedMediaCached } from '@/utils/readImageCache'

const MAX_WARM_ITEMS = 24

/**
 * Pre-warm disk-backed gallery media cache without storing base64
 * on every `CompletedWork` in Zustand (saves memory).
 */
export async function warmGalleryImageCache(): Promise<void> {
  if (!window.electronAPI?.readImage && !window.electronAPI?.getLocalMediaUrl) return

  const works = useQuestStore.getState().completedWorks
  if (works.length === 0) return

  const queue: string[] = []
  for (const work of works.slice(-MAX_WARM_ITEMS)) {
    if (work.imageUrl?.startsWith('data:')) continue
    if (work.savedPath) queue.push(work.savedPath)
    if (work.thumbnailPath && work.thumbnailPath !== work.savedPath) {
      queue.push(work.thumbnailPath)
    }
  }

  if (queue.length === 0) return

  const CONCURRENCY = 8
  let index = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (index < queue.length) {
      const current = queue[index++]
      if (!current) continue
      await readSavedMediaCached(current)
    }
  })
  await Promise.all(workers)
}
