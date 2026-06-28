import { describe, expect, it, beforeEach } from 'vitest'
import { FUNDAMENTALS_TRACK_NOVICE_ID } from '@/data/fundamentalsExercises'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { resolveQuestReferenceInput } from '@/utils/resolveQuestReferenceInput'

describe('resolveQuestReferenceInput', () => {
  beforeEach(() => {
    useQuestSessionStore.setState({ session: null })
  })

  it('uses fundamentals phase title and topic tags instead of track meta tags', () => {
    const input = resolveQuestReferenceInput(
      {
        id: FUNDAMENTALS_TRACK_NOVICE_ID,
        category: 'drawing',
        tags: ['fundamentals', 'book-25', 'track', 'novice'],
      },
      0,
    )

    expect(input.referenceQuery).toBe('Straights and Curves lines drawing reference')
    expect(input.tags).toEqual(['lines'])
  })

  it('reads active fundamentals phase from the quest session', () => {
    useQuestSessionStore.setState({
      session: {
        questId: FUNDAMENTALS_TRACK_NOVICE_ID,
        currentPhaseIndex: 1,
        phases: [
          { kind: 'fundamentals', phaseIndex: 0, durationSec: 900 },
          { kind: 'fundamentals', phaseIndex: 1, durationSec: 900 },
        ],
      } as never,
    })

    const input = resolveQuestReferenceInput({
      id: FUNDAMENTALS_TRACK_NOVICE_ID,
      category: 'drawing',
      tags: ['fundamentals', 'book-25', 'track', 'novice'],
    })

    expect(input.referenceQuery).toBe('Point Coordination circles ellipses drawing reference')
    expect(input.tags).toEqual(['circles', 'ellipses'])
  })
})
