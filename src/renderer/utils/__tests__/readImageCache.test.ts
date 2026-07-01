import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  readImageCached,
  readLocalMediaUrlCached,
  readSavedMediaCached,
  invalidateReadImageCache,
} from '../readImageCache'

function mockGallery(partial: Record<string, unknown>) {
  return { gallery: partial } as typeof window.electronAPI
}

describe('readImageCached', () => {
  let prevApi: typeof window.electronAPI

  beforeEach(() => {
    invalidateReadImageCache()
    prevApi = window.electronAPI
  })

  afterEach(() => {
    window.electronAPI = prevApi
    invalidateReadImageCache()
  })

  it('returns null when electron readImage is missing', async () => {
    window.electronAPI = undefined
    await expect(readImageCached('/x.png')).resolves.toBeNull()
  })

  it('allows retry after a failed read', async () => {
    const readImage = vi
      .fn()
      .mockRejectedValueOnce(new Error('disk'))
      .mockResolvedValueOnce('data:image/png;base64,BB')
    window.electronAPI = mockGallery({ readImage })

    await expect(readImageCached('/retry.png')).resolves.toBeNull()
    await expect(readImageCached('/retry.png')).resolves.toBe('data:image/png;base64,BB')
    expect(readImage).toHaveBeenCalledTimes(2)
  })

  it('dedupes concurrent reads for the same path', async () => {
    const readImage = vi.fn(async () => 'data:image/png;base64,AA')
    window.electronAPI = mockGallery({ readImage })

    const a = readImageCached('/quest-1.png')
    const b = readImageCached('/quest-1.png')
    await expect(Promise.all([a, b])).resolves.toEqual([
      'data:image/png;base64,AA',
      'data:image/png;base64,AA',
    ])
    expect(readImage).toHaveBeenCalledTimes(1)
  })
})

describe('readSavedMediaCached', () => {
  let prevApi: typeof window.electronAPI

  beforeEach(() => {
    invalidateReadImageCache()
    prevApi = window.electronAPI
  })

  afterEach(() => {
    window.electronAPI = prevApi
    invalidateReadImageCache()
  })

  it('routes videos to getLocalMediaUrl', async () => {
    const readImage = vi.fn(async () => 'data:image/png;base64,AA')
    const getLocalMediaUrl = vi.fn(async () => 'file:///saved/clips/quest-1.mp4')
    window.electronAPI = mockGallery({ readImage, getLocalMediaUrl })

    await expect(readSavedMediaCached('/clips/quest-1.mp4')).resolves.toBe('file:///saved/clips/quest-1.mp4')
    expect(getLocalMediaUrl).toHaveBeenCalledTimes(1)
    expect(readImage).not.toHaveBeenCalled()
  })

  it('routes images to getLocalMediaUrl when available', async () => {
    const readImage = vi.fn(async () => 'data:image/png;base64,AA')
    const getLocalMediaUrl = vi.fn(async () => 'file:///saved/quest-1.png')
    window.electronAPI = mockGallery({ readImage, getLocalMediaUrl })

    await expect(readSavedMediaCached('/saved/quest-1.png')).resolves.toBe('file:///saved/quest-1.png')
    expect(getLocalMediaUrl).toHaveBeenCalledTimes(1)
    expect(readImage).not.toHaveBeenCalled()
  })

  it('dedupes concurrent video reads', async () => {
    const getLocalMediaUrl = vi.fn(async () => 'file:///saved/quest-1.webm')
    window.electronAPI = mockGallery({ getLocalMediaUrl })

    const a = readLocalMediaUrlCached('/saved/quest-1.webm')
    const b = readLocalMediaUrlCached('/saved/quest-1.webm')
    await expect(Promise.all([a, b])).resolves.toEqual([
      'file:///saved/quest-1.webm',
      'file:///saved/quest-1.webm',
    ])
    expect(getLocalMediaUrl).toHaveBeenCalledTimes(1)
  })
})
