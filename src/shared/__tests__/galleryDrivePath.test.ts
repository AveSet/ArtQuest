import { describe, expect, it } from 'vitest'
import {
  buildGalleryRemotePath,
  galleryMonthFolderKey,
  galleryRemoteFolderPath,
} from '../galleryDrivePath'

describe('galleryDrivePath', () => {
  it('formats month folder from ISO date', () => {
    expect(galleryMonthFolderKey('2026-07-15T10:00:00.000Z')).toBe('2026-07')
  })

  it('builds remote path with month subfolder', () => {
    expect(buildGalleryRemotePath('/ArtQuest/Gallery', '2026-07-01T00:00:00.000Z', 'quest-1-123.png')).toBe(
      '/ArtQuest/Gallery/2026-07/quest-1-123.png',
    )
  })

  it('extracts parent folder from remote file path', () => {
    expect(galleryRemoteFolderPath('/ArtQuest/Gallery/2026-07/quest-1.png')).toBe('/ArtQuest/Gallery/2026-07')
  })
})
