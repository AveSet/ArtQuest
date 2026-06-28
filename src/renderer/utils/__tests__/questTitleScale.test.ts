import { describe, it, expect } from 'vitest'
import { extractTitleWorkScale, normalizeTitleForCatalogMatch } from '../questTitleScale'

describe('normalizeTitleForCatalogMatch', () => {
  it('replaces numbers with placeholder', () => {
    expect(normalizeTitleForCatalogMatch('нарисовать 5 кубов')).toBe(
      normalizeTitleForCatalogMatch('нарисовать 5000 кубов'),
    )
  })
})

describe('extractTitleWorkScale', () => {
  it('returns higher multiplier for 5000 than for 5 (drill cap)', () => {
    const a = extractTitleWorkScale('нарисовать 5 кубов')
    const b = extractTitleWorkScale('нарисовать 5000 кубов')
    expect(b.quantityMultiplier).toBeGreaterThan(a.quantityMultiplier)
    expect(b.quantityMultiplier).toBeLessThanOrEqual(2.2)
  })
})
