import { describe, expect, it } from 'vitest'
import {
  buildReferenceQuery,
  buildReferenceSourceUrl,
  normalizeReferenceSource,
} from '@/utils/buildReferenceQuery'

const questWithTags = {
  id: 42,
  title: { en: 'Hand poses gesture study', ru: 'Жесты рук' },
  category: 'anatomy' as const,
  tags: ['hands', 'poses', 'gesture', 'novice', 'practice', 'digital'],
}

describe('buildReferenceQuery', () => {
  it('builds short contextual Pinterest query from quest title and tags', () => {
    const query = buildReferenceQuery(questWithTags, 'pinterest')
    expect(query.split(/\s+/).length).toBeLessThanOrEqual(6)
    expect(query.toLowerCase()).toMatch(/reference|art/)
  })

  it('builds YouTube tutorial query with limited words', () => {
    const query = buildReferenceQuery(questWithTags, 'youtube')
    expect(query.split(/\s+/).length).toBeLessThanOrEqual(6)
    expect(query.toLowerCase()).toContain('tutorial')
  })

  it('builds single-word Sketchfab query', () => {
    const query = buildReferenceQuery(questWithTags, 'sketchfab')
    expect(query.split(/\s+/).length).toBeLessThanOrEqual(2)
  })

  it('uses explicit referenceQuery when concise', () => {
    expect(
      buildReferenceQuery(
        {
          ...questWithTags,
          referenceQuery: 'hand pose reference',
        },
        'pinterest',
      ),
    ).toBe('hand pose reference')
  })

  it('uses fundamentals phase reference query for track quests', () => {
    expect(
      buildReferenceQuery(
        {
          id: 96001,
          title: { en: 'Fundamentals track', ru: 'Fundamentals track' },
          category: 'drawing',
          tags: ['fundamentals', 'book-25', 'track', 'novice'],
        },
        'google',
        0,
      ),
    ).toBe('Straights and Curves lines drawing reference')
  })

  it('migrates legacy artstation to sketchfab URLs', () => {
    expect(normalizeReferenceSource('artstation')).toBe('sketchfab')
    expect(buildReferenceSourceUrl('artstation' as never, 'warrior')).toBe(
      'https://sketchfab.com/search?q=warrior&type=models&sort_by=relevance',
    )
  })

  it('builds source-specific URLs', () => {
    expect(buildReferenceSourceUrl('google', 'plants reference')).toBe(
      'https://images.google.com/search?tbm=isch&q=plants%20reference',
    )
    expect(buildReferenceSourceUrl('youtube_short', 'gesture')).toBe(
      'https://www.youtube.com/results?search_query=gesture%20%23shorts',
    )
    expect(buildReferenceSourceUrl('clipTips', 'line art')).toBe(
      'https://tips.clip-studio.com/en-us/search?word=line%20art',
    )
  })
})
