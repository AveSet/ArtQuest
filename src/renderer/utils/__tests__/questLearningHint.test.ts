import { describe, it, expect } from 'vitest'
import { buildQuestLearningHint } from '@/utils/questLearningHint'
import type { Quest } from '@/store/models'

function makeQuest(tags: string[]): Quest {
  return {
    id: 1,
    code: 't',
    title: { en: 'T', ru: 'T', zh: 'T', ja: 'T', ko: 'T' },
    description: { en: 'Draw proportions carefully', ru: 'Draw proportions carefully', zh: 'Draw proportions carefully', ja: 'Draw proportions carefully', ko: 'Draw proportions carefully' },
    category: 'drawing',
    difficulty: 'novice',
    xp: 50,
    estimatedTime: 20,
    prerequisites: [],
    tags,
    source: 'test',
    icon: '',
    color: '',
    min_level: 1,
    medium: 'digital',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
  }
}

describe('buildQuestLearningHint', () => {
  it('appends focus suffix when focus tags match quest', () => {
    const hint = buildQuestLearningHint(makeQuest(['proportion', 'line']), 'en', 'Draw proportions carefully', ['proportion'])
    expect(hint.line).toContain('Focus:')
    expect(hint.line).toContain('Proportions')
  })

  it('omits focus suffix without matching tags', () => {
    const hint = buildQuestLearningHint(makeQuest(['line']), 'en', 'Draw lines', ['perspective'])
    expect(hint.line).not.toContain('Focus:')
  })
})
