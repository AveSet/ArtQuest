import { describe, expect, it } from 'vitest'
import {
  isAllowedReferenceHost,
  validateExternalOpenUrl,
  validateReferenceNavigationUrl,
} from '../referenceUrlPolicy'

describe('referenceUrlPolicy', () => {
  it('allows known material hosts over https', () => {
    expect(validateReferenceNavigationUrl('https://www.youtube.com/watch?v=abc12345678').ok).toBe(true)
    expect(validateReferenceNavigationUrl('https://www.pinterest.com/search/pins/?q=anatomy').ok).toBe(true)
    expect(validateReferenceNavigationUrl('https://www.artstation.com/search?query=warrior').ok).toBe(true)
    expect(validateReferenceNavigationUrl('https://images.google.com/search?tbm=isch&q=plants').ok).toBe(true)
    expect(validateReferenceNavigationUrl('https://sketchfab.com/search?q=hand').ok).toBe(true)
    expect(validateReferenceNavigationUrl('https://tips.clip-studio.com/en-us/search?word=pose').ok).toBe(true)
  })

  it('rejects http and arbitrary hosts', () => {
    expect(validateReferenceNavigationUrl('http://www.youtube.com/watch?v=abc12345678').ok).toBe(false)
    expect(validateReferenceNavigationUrl('https://evil.example/phish').ok).toBe(false)
    expect(validateReferenceNavigationUrl('file:///etc/passwd').ok).toBe(false)
  })

  it('matches host suffixes with and without www', () => {
    expect(isAllowedReferenceHost('youtube.com')).toBe(true)
    expect(isAllowedReferenceHost('m.youtube.com')).toBe(true)
    expect(isAllowedReferenceHost('www.pinterest.com')).toBe(true)
    expect(isAllowedReferenceHost('attacker.com')).toBe(false)
  })

  it('uses the same policy for open-external', () => {
    const allowed = validateExternalOpenUrl('https://www.youtube.com/results?search_query=pose')
    const blocked = validateExternalOpenUrl('https://malware.test')
    expect(allowed.ok).toBe(true)
    expect(blocked.ok).toBe(false)
  })
})
