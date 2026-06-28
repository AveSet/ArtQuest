const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 250 * 1024 * 1024

export function dataUrlToBuffer(
  dataUrl: string,
): { buffer: Buffer; ext: string; mediaType: 'image' | 'video' } | null {
  const match = dataUrl.match(/^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const kind = match[1] === 'video' ? 'video' : 'image'
  const rawExt = (match[2] ?? '').toLowerCase()
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'quicktime' ? 'mov' : rawExt
  const buffer = Buffer.from(match[3] ?? '', 'base64')
  if (kind === 'image' && buffer.byteLength > MAX_IMAGE_BYTES) return null
  if (kind === 'video' && buffer.byteLength > MAX_VIDEO_BYTES) return null
  if (!/^[a-z0-9]+$/.test(ext)) return null
  return { buffer, ext, mediaType: kind }
}
