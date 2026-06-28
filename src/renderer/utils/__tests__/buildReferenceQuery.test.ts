import { describe, expect, it } from 'vitest'
import { buildReferenceQuery, buildReferenceSourceUrl } from '@/utils/buildReferenceQuery'

describe('buildReferenceQuery', () => {
  it('builds Pinterest image reference queries from quest category and tags', () => {
    expect(buildReferenceQuery({
      category: 'drawing',
      tags: ['plants', 'flat-color', 'botanical'],
    }, 'pinterest')).toBe('drawing plants flat-color botanical reference')
  })

  it('builds YouTube tutorial queries instead of reference queries', () => {
    expect(buildReferenceQuery({
      category: 'anatomy',
      tags: ['hands', 'poses', 'gesture'],
    }, 'youtube')).toBe('anatomy hands poses gesture tutorial step by step')
  })

  it('builds ArtStation portfolio-style queries', () => {
    expect(buildReferenceQuery({
      category: 'character_design',
      tags: ['warrior', 'armor'],
    }, 'artstation')).toBe('character design warrior armor concept art illustration')
  })

  it('uses explicit referenceQuery as the Pinterest query', () => {
    expect(buildReferenceQuery({
      id: 1,
      category: 'drawing',
      tags: ['plants'],
      referenceQuery: 'flat color fill plants reference',
    }, 'pinterest')).toBe('flat color fill plants reference')
  })

  it('uses fundamentals phase reference query for track quests', () => {
    expect(buildReferenceQuery({
      id: 96001,
      category: 'drawing',
      tags: ['fundamentals', 'book-25', 'track', 'novice'],
    }, 'google', 0)).toBe('Straights and Curves lines drawing reference')
  })

  it('builds source-specific URLs', () => {
    expect(buildReferenceSourceUrl('google', 'flat color plants art reference')).toBe(
      'https://images.google.com/search?tbm=isch&q=flat%20color%20plants%20art%20reference',
    )
    expect(buildReferenceSourceUrl('artstation', 'warrior concept art')).toBe(
      'https://www.artstation.com/search?query=warrior%20concept%20art',
    )
  })
})
