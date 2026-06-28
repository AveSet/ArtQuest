import { describe, expect, it } from 'vitest'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import {
  buildClipStudioTipsQueryResources,
  buildPinterestQueryResources,
  buildSketchfabQueryResources,
  clipStudioTipsSearchUrl,
  externalSearchUrlForResource,
  isClipTipsQueryResource,
  isPinterestQueryResource,
  sketchfabSearchUrl,
  pinterestSearchUrl,
} from '@/utils/materialExternalCatalog'

describe('materialExternalCatalog', () => {
  it('builds Clip Studio search URLs on en-us', () => {
    expect(clipStudioTipsSearchUrl('perspective')).toBe(
      'https://tips.clip-studio.com/en-us/search?word=perspective',
    )
    expect(clipStudioTipsSearchUrl('анатомия')).toBe(
      'https://tips.clip-studio.com/en-us/search?word=%D0%B0%D0%BD%D0%B0%D1%82%D0%BE%D0%BC%D0%B8%D1%8F',
    )
  })

  it('builds Sketchfab search URLs', () => {
    expect(sketchfabSearchUrl('anatomy')).toBe(
      'https://sketchfab.com/search?q=anatomy&type=models&sort_by=relevance',
    )
  })

  it('creates tag-based rows for a skill node', () => {
    const node = SKILL_TREE_NODES.find((n) => n.id === 'anatomy_hands')
    expect(node).toBeDefined()
    const rows = buildClipStudioTipsQueryResources([node!], {
      tag: null,
      preferredTags: [],
      search: '',
      category: 'all',
    })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(isClipTipsQueryResource)).toBe(true)
    expect(externalSearchUrlForResource(rows[0]!, 'en')).toContain('tips.clip-studio.com')
  })

  it('builds Pinterest search URLs', () => {
    expect(pinterestSearchUrl('character design')).toBe(
      'https://www.pinterest.com/search/pins/?q=character%20design',
    )
  })

  it('creates Pinterest rows from preferred tags', () => {
    const rows = buildPinterestQueryResources([], {
      tag: null,
      preferredTags: ['anatomy'],
      search: '',
      category: 'anatomy',
    })
    expect(rows.some(isPinterestQueryResource)).toBe(true)
    expect(externalSearchUrlForResource(rows[0]!, 'en')).toContain('pinterest.com/search')
  })

  it('creates Sketchfab rows from active tag filter', () => {
    const rows = buildSketchfabQueryResources([], {
      tag: 'perspective',
      preferredTags: [],
      search: '',
      category: 'drawing',
    })
    expect(rows.some((r) => r.channelLabelOverride?.toLowerCase().includes('perspective'))).toBe(true)
    const match = rows.find((r) => r.channelLabelOverride?.toLowerCase().includes('perspective'))
    expect(externalSearchUrlForResource(match!, 'en')).toContain('sketchfab.com/search')
  })
})
