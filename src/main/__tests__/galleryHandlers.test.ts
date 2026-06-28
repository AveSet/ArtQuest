import { describe, it, expect } from 'vitest'
import { validateMediaData, validateQuestId } from '../ipc/galleryValidation'

describe('galleryHandlers validation', () => {
  it('accepts small image data URLs', () => {
    expect(validateMediaData('data:image/png;base64,abcd')).toBe(true)
  })

  it('rejects invalid quest ids', () => {
    expect(validateQuestId('../escape')).toBe(false)
    expect(validateQuestId('quest-42')).toBe(true)
  })

  it('rejects oversize image payloads', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(40_000_000)
    expect(validateMediaData(huge)).toBe(false)
  })
})
