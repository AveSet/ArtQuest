import { describe, it, expect } from 'vitest'
import {
  criterionToFocusTags,
  collectLearningFocusTags,
  buildMaterialsLearnPath,
  pickBestDailyQuest,
  questMatchesFocusTags,
} from '../learningFocus'
import type { Quest } from '@/store/models'

function q(id: number, tags: string[]): Quest {
  return {
    id,
    code: '',
    title: { en: '', ru: '', zh: '', ja: '', ko: '' },
    category: 'drawing',
    difficulty: 'novice',
    description: { en: '', ru: '', zh: '', ja: '', ko: '' },
    xp: 10,
    estimatedTime: 15,
    source: '',
    icon: '',
    color: '',
    min_level: 1,
    tags,
    prerequisites: [],
    medium: 'both',
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
  } as Quest
}

describe('learningFocus', () => {
  it('maps line_confidence to line-related tags', () => {
    expect(criterionToFocusTags('line_confidence')).toContain('line')
  })

  it('buildMaterialsLearnPath uses tags query not raw criterion', () => {
    const path = buildMaterialsLearnPath(['line', 'sketch'])
    expect(path).toContain('view=learn')
    expect(path).toContain('tags=line')
    expect(path).not.toContain('line_confidence')
  })

  it('pickBestDailyQuest prefers focus tags', () => {
    const a = q(1, ['color'])
    const b = q(2, ['line', 'sketch'])
    const best = pickBestDailyQuest([a, b], ['line'])
    expect(best?.id).toBe(2)
  })

  it('collectLearningFocusTags includes gallery improvement notes', () => {
    const tags = collectLearningFocusTags({
      questCompletionLogs: [],
      completedWorks: [
        {
          questId: 1,
          imageUrl: 'x',
          date: '2026-01-01',
          improvementNotes: 'work on proportion and line',
        },
      ],
    })
    expect(tags.some((t) => t === 'proportion' || t === 'line')).toBe(true)
  })

  it('questMatchesFocusTags scores matching quests', () => {
    expect(questMatchesFocusTags(q(1, ['line']), ['line'])).toBeGreaterThan(0)
    expect(questMatchesFocusTags(q(1, ['color']), ['line'])).toBe(0)
  })
})
