import { describe, it, expect } from 'vitest'
import { buildQuestSubmissionCriteria } from '../questReflectionCriteria'

describe('buildQuestSubmissionCriteria', () => {
  it('maps mistake tags to weak criteria ratings', () => {
    const criteria = buildQuestSubmissionCriteria(['line', 'proportion'], {})
    expect(criteria).toEqual(
      expect.arrayContaining([
        { label: 'line_confidence', rating: 2 },
        { label: 'proportion', rating: 2 },
      ]),
    )
  })

  it('merges optional strength ratings without overwriting weaker mistake scores', () => {
    const criteria = buildQuestSubmissionCriteria(
      ['line'],
      { line_confidence: 4, composition: 5 },
    )
    expect(criteria).toEqual(
      expect.arrayContaining([
        { label: 'line_confidence', rating: 2 },
        { label: 'composition', rating: 5 },
      ]),
    )
  })
})
