import { describe, expect, it } from 'vitest'
import {
  isValidExportPayload,
  isValidShareCardPayload,
  MAX_EXPORT_BYTES,
  MAX_SHARE_CARD_BYTES,
  sanitizeShareCardFilename,
} from '../ipc/shellExportValidation'

describe('shellHandlers validation', () => {
  it('sanitizes share card filenames', () => {
    expect(sanitizeShareCardFilename('my-card.png')).toBe('my-card.png')
    expect(sanitizeShareCardFilename('../evil.png')).toBe('artquest-share.png')
    expect(sanitizeShareCardFilename(null)).toBe('artquest-share.png')
  })

  it('validates share card payload size', () => {
    expect(isValidShareCardPayload('abc')).toBe(true)
    expect(isValidShareCardPayload('x'.repeat(MAX_SHARE_CARD_BYTES + 1))).toBe(false)
    expect(isValidShareCardPayload(42)).toBe(false)
  })

  it('validates export payload size', () => {
    expect(isValidExportPayload('{}')).toBe(true)
    expect(isValidExportPayload('x'.repeat(MAX_EXPORT_BYTES + 1))).toBe(false)
  })
})
