import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCoreVideoCatalog,
  loadExtendedVideoCatalog,
  loadVideoCatalog,
  resetVideoCatalogCache,
} from '../loadVideoCatalog'
import { CORE_VIDEO_RESOURCES } from '@/data/videoResources'

vi.mock('@/data/videoResourcesCurated', () => ({
  buildExtendedVideoCatalog: vi.fn(async () => [
    {
      id: 'auto-yt-test-node-dQw4w9WgXcQ',
      youtubeId: 'dQw4w9WgXcQ',
      titleEn: 'Extended',
      titleRu: 'Extended',
      channelKey: 'youtube_curated_mix',
      category: 'drawing',
      nodeIds: ['test-node'],
      tags: ['curated-youtube-search'],
      chapters: [{ labelEn: 'Full video', labelRu: 'Весь ролик', startSec: 0 }],
    },
  ]),
}))

describe('loadVideoCatalog', () => {
  beforeEach(() => {
    resetVideoCatalogCache()
    vi.clearAllMocks()
  })

  it('returns core catalog synchronously', () => {
    expect(getCoreVideoCatalog()).toEqual(CORE_VIDEO_RESOURCES)
  })

  it('merges extended rows into full catalog', async () => {
    const full = await loadExtendedVideoCatalog()
    expect(full.length).toBe(CORE_VIDEO_RESOURCES.length + 1)
    expect(full.some((r) => r.id.startsWith('auto-yt-'))).toBe(true)
  })

  it('dedupes concurrent extended loads', async () => {
    const a = loadExtendedVideoCatalog()
    const b = loadVideoCatalog()
    const [one, two] = await Promise.all([a, b])
    expect(one).toBe(two)
  })
})
