import { describe, expect, it } from 'vitest'
import {
  buildCompositeMaterialSearchQuery,
  buildMaterialTagSearchQueries,
} from '@/utils/materialTagSearchQueries'

describe('materialTagSearchQueries', () => {
  it('builds composite query with art reference for pinterest', () => {
    const q = buildCompositeMaterialSearchQuery(
      {
        node: null,
        tag: 'anatomy',
        preferredTags: [],
        search: '',
        category: 'drawing',
        lang: 'en',
      },
      'pinterest',
    )
    expect(q.toLowerCase()).toContain('anatomy')
    expect(q.toLowerCase()).toContain('art reference')
  })

  it('uses English title for Clip Studio external search when UI is ru', () => {
    const q = buildCompositeMaterialSearchQuery(
      {
        node: {
          category: 'drawing',
          title: { en: 'Perspective', ru: 'Перспектива' },
          tags: ['perspective'],
        },
        tag: null,
        preferredTags: [],
        search: '',
        category: 'drawing',
        lang: 'ru',
      },
      'clipTips',
    )
    expect(q.toLowerCase()).toContain('perspective')
    expect(q).not.toContain('Перспектива')
    expect(q.toLowerCase()).toContain('tutorial')
  })

  it('uses quest title for contextual search instead of category labels', () => {
    const q = buildCompositeMaterialSearchQuery({
      questTitle: { en: 'Perspective study', ru: 'Перспектива' },
      node: {
        category: 'drawing',
        title: { en: 'Perspective', ru: 'Перспектива' },
        tags: ['perspective'],
      },
      tag: null,
      preferredTags: [],
      search: '',
      category: 'drawing',
      lang: 'ru',
    })
    expect(q.toLowerCase()).toContain('perspective')
    expect(q).not.toContain('Перспектива')
  })

  it('returns a few distinct queries capped at 3', () => {
    const queries = buildMaterialTagSearchQueries(
      {
        node: {
          category: 'drawing',
          title: { en: 'Shapes', ru: 'Формы' },
          tags: ['shapes', 'volume', 'forms'],
        },
        tag: 'gesture',
        preferredTags: ['line'],
        search: '',
        category: 'drawing',
        lang: 'en',
      },
      'clipTips',
    )
    expect(queries.length).toBeGreaterThan(0)
    expect(queries.length).toBeLessThanOrEqual(3)
  })
})
