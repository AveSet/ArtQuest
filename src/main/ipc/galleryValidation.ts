export function validateMediaData(base64Data: string): boolean {
  if (typeof base64Data !== 'string') return false
  const isImage = base64Data.startsWith('data:image/')
  const isVideo = base64Data.startsWith('data:video/')
  if (!isImage && !isVideo) return false
  const base64Part = base64Data.split(',')[1]
  if (!base64Part) return false
  const sizeInBytes = Math.ceil((base64Part.length * 3) / 4)
  const maxBytes = isVideo ? 250 * 1024 * 1024 : 25 * 1024 * 1024
  return sizeInBytes <= maxBytes
}

export function validateQuestId(questId: string): boolean {
  if (typeof questId !== 'string') return false
  return /^[a-zA-Z0-9-]+$/.test(questId) && questId.length <= 50
}
