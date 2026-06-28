import { describe, it, expect } from 'vitest'
import { tokenizeTitleForTags } from '../tokenizeTitleForTags'

describe('tokenizeTitleForTags', () => {
  it('extracts words and dedupes', () => {
    expect(tokenizeTitleForTags('How to Draw Perspective — Basics Tutorial')).toContain('perspective')
    expect(tokenizeTitleForTags('How to Draw Perspective — Basics Tutorial')).toContain('draw')
  })

  it('respects max count', () => {
    expect(tokenizeTitleForTags('one two three four five six seven', 3)).toHaveLength(3)
  })
})
