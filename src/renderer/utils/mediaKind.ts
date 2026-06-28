export type WorkMediaKind = 'image' | 'video'

export function mediaKindFromPath(pathOrUrl: string): WorkMediaKind {
  if (/\.(mp4|webm|mov)(\?|$)/i.test(pathOrUrl)) return 'video'
  if (pathOrUrl.startsWith('data:video/')) return 'video'
  return 'image'
}

export function mediaKindFromWork(work: {
  mediaType?: WorkMediaKind
  imageUrl?: string
  savedPath?: string
}): WorkMediaKind {
  if (work.mediaType) return work.mediaType
  return mediaKindFromPath(work.savedPath || work.imageUrl || '')
}
