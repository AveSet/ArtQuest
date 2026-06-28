import { describe, it, expect } from 'vitest'
import { buildUserQuestTags } from '../userQuestTags'

describe('buildUserQuestTags', () => {
  it('includes skill, category, difficulty, digital, and title tokens', () => {
    const tags = buildUserQuestTags('Gesture sketch warmup', 'drawing', 'novice', [
      'gesture',
      'speed',
    ])
    expect(tags).toContain('gesture')
    expect(tags).toContain('speed')
    expect(tags).toContain('drawing')
    expect(tags).toContain('novice')
    expect(tags).toContain('digital')
    expect(tags).toContain('custom')
    expect(tags.some((t) => t.includes('sketch') || t === 'warmup')).toBe(true)
  })
})
