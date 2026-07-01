import { describe, expect, it } from 'vitest'
import {
  buildQuestPinterestUrl,
  buildQuestReferenceSearchQuery,
} from '@/utils/questPinterestUrl'

describe('questPinterestUrl', () => {
  it('builds a short plant reference query from category and tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'drawing',
      tags: ['plants', 'flat-color', 'botanical'],
    })

    expect(query.split(/\s+/).length).toBeLessThanOrEqual(6)
    expect(query.toLowerCase()).toMatch(/reference/)
    expect(query.toLowerCase()).toMatch(/plants|botanical|drawing/)
  })

  it('builds a hand poses reference query from anatomy tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'anatomy',
      tags: ['hands', 'poses', 'gesture'],
    })

    expect(query.split(/\s+/).length).toBeLessThanOrEqual(6)
    expect(query.toLowerCase()).toMatch(/hands|gesture|anatomy/)
  })

  it('uses an explicit referenceQuery before category and tags', () => {
    const query = buildQuestReferenceSearchQuery({
      category: 'drawing',
      tags: ['plants', 'flat-color'],
      referenceQuery: '  anatomy hand poses gesture drawing reference  ',
    })

    expect(query).toBe('anatomy hand poses gesture drawing reference')
  })

  it('builds Pinterest URLs from quest reference metadata', () => {
    const url = buildQuestPinterestUrl({
      category: 'drawing',
      tags: ['plants', 'flat-color', 'botanical'],
    })

    expect(url).toMatch(/^https:\/\/www\.pinterest\.com\/search\/pins\/\?q=/)
    expect(decodeURIComponent(url).toLowerCase()).toMatch(/plants|botanical/)
  })
})
