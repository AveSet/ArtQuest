/** Google Drive gallery path helpers (shared by main + tests). */

/** Month folder key from ISO timestamp, e.g. `2026-07`. */
export function galleryMonthFolderKey(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Remote path: `/ArtQuest/Gallery/2026-07/quest-1-123.png`. */
export function buildGalleryRemotePath(remoteRoot: string, createdAt: string, filename: string): string {
  const root = remoteRoot.replace(/\/+$/, '')
  const month = galleryMonthFolderKey(createdAt)
  return `${root}/${month}/${filename}`
}

/** Parent folder path for a full remote file path. */
export function galleryRemoteFolderPath(remotePath: string): string {
  const normalized = remotePath.replace(/\/+$/, '')
  const idx = normalized.lastIndexOf('/')
  if (idx <= 0) return normalized
  return normalized.slice(0, idx)
}
