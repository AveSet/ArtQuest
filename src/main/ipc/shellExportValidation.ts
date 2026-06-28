export const MAX_SHARE_CARD_BYTES = 20 * 1024 * 1024
export const MAX_EXPORT_BYTES = 100 * 1024 * 1024

export function sanitizeShareCardFilename(raw: unknown): string {
  if (typeof raw === 'string' && /^[\w.-]+\.png$/i.test(raw)) return raw
  return 'artquest-share.png'
}

export function isValidShareCardPayload(raw: unknown): raw is string {
  return typeof raw === 'string' && raw.length <= MAX_SHARE_CARD_BYTES
}

export function isValidExportPayload(raw: unknown): raw is string {
  return typeof raw === 'string' && raw.length <= MAX_EXPORT_BYTES
}
