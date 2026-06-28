import { describe, expect, it } from 'vitest'
import { resolveLightboxClickAction } from '../galleryLightboxClick'

const rect = new DOMRect(100, 80, 200, 150)

describe('resolveLightboxClickAction', () => {
  it('closes above and below media', () => {
    expect(resolveLightboxClickAction(200, 50, rect, true)).toBe('close')
    expect(resolveLightboxClickAction(200, 250, rect, true)).toBe('close')
  })

  it('navigates left and right when multiple items', () => {
    expect(resolveLightboxClickAction(50, 150, rect, true)).toBe('prev')
    expect(resolveLightboxClickAction(350, 150, rect, true)).toBe('next')
  })

  it('closes on horizontal outside when single item', () => {
    expect(resolveLightboxClickAction(50, 150, rect, false)).toBe('close')
    expect(resolveLightboxClickAction(350, 150, rect, false)).toBe('close')
  })

  it('ignores clicks on media', () => {
    expect(resolveLightboxClickAction(200, 150, rect, true)).toBe('none')
  })
})
