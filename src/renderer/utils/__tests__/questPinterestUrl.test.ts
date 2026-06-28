import { describe, expect, it } from 'vitest'
import {
  buildQuestPinterestUrl,
  buildQuestReferenceSearchQuery,
} from '@/utils/questPinterestUrl'

describe('questPinterestUrl', () => {
  it('builds a quest-specific plant reference query from category and tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'drawing',
      tags: ['plants', 'flat-color', 'botanical'],
    })

    expect(query).toBe('drawing plants flat-color botanical reference')
  })

  it('builds a hand poses reference query from anatomy tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'anatomy',
      tags: ['hands', 'poses', 'gesture'],
    })

    expect(query).toBe('anatomy hands poses gesture reference')
  })

  it('uses an explicit referenceQuery before category and tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'drawing',
      tags: ['plants', 'flat-color'],
      referenceQuery: '  anatomy hand poses gesture drawing reference  ',
    })

    expect(query).toBe('anatomy hand poses gesture drawing reference')
  })

  it('builds Pinterest URLs without relying on quest titles', () => {
    const url = buildQuestPinterestUrl({
      category: 'drawing',
      tags: ['plants', 'flat-color', 'botanical'],
    })

    expect(decodeURIComponent(url)).toContain('q=drawing plants flat-color botanical reference')
  })
})
