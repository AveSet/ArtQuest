import { describe, expect, it } from 'vitest'
import {
  buildContextualMaterialSearchQuery,
  extractContextualSubjectTerms,
} from '@/utils/contextualMaterialSearch'

const ENERGY_SHIELD_QUEST = {
  en: 'Draw the shape of energy shield from a reference',
  ru: 'Нарисуй форму «энергетический щит» по референсу',
}

describe('contextualMaterialSearch', () => {
  it('builds short Clip Studio query for energy shield quest (no meta tags)', () => {
    const q = buildContextualMaterialSearchQuery(
      {
        questTitle: ENERGY_SHIELD_QUEST,
        node: null,
        preferredTags: ['reference', 'accuracy', 'novice', 'effects', 'both'],
        tag: null,
        search: '',
        category: 'effects',
      },
      'clipTips',
    )
    const lower = q.toLowerCase()
    expect(lower).not.toContain('reference')
    expect(lower).not.toContain('accuracy')
    expect(lower).not.toContain('novice')
    expect(lower).not.toContain('basics')
    expect(q.split(/\s+/).length).toBeLessThanOrEqual(6)
    expect(lower).toContain('energy')
    expect(lower).toContain('shield')
    expect(lower).toContain('effects')
    expect(lower).toContain('tutorial')
  })

  it('prefers magic boost for energy shield subject', () => {
    const terms = extractContextualSubjectTerms({
      questTitle: ENERGY_SHIELD_QUEST,
      node: null,
      preferredTags: ['reference', 'accuracy', 'novice', 'effects', 'both'],
      tag: null,
      search: '',
      category: 'effects',
    })
    expect(terms).toContain('magic')
    expect(terms).toContain('energy')
    expect(terms).toContain('shield')
  })

  it('uses manual search when user typed a query', () => {
    const q = buildContextualMaterialSearchQuery(
      {
        questTitle: ENERGY_SHIELD_QUEST,
        node: null,
        preferredTags: [],
        tag: null,
        search: 'custom query words',
        category: 'effects',
      },
      'pinterest',
    )
    expect(q.toLowerCase()).toContain('custom')
    expect(q.toLowerCase()).toContain('art reference')
  })

  it('uses one Sketchfab keyword from quest title after colon', () => {
    const q = buildContextualMaterialSearchQuery(
      {
        questTitle: {
          en: 'Digital block-in: mechanism',
          ru: 'Цифровая разбивка: механизма',
        },
        node: null,
        preferredTags: ['reference', 'novice', 'drawing'],
        tag: null,
        search: '',
        category: 'drawing',
      },
      'sketchfab',
    )
    expect(q).toBe('mechanism')
    expect(q.split(/\s+/).length).toBe(1)
  })

  it('builds pinterest suffix without bloated labels', () => {
    const q = buildContextualMaterialSearchQuery(
      {
        questTitle: { en: 'Perspective study from photo', ru: 'Перспектива по фото' },
        node: null,
        preferredTags: ['perspective', 'reference', 'novice'],
        tag: null,
        search: '',
        category: 'drawing',
      },
      'pinterest',
    )
    expect(q.toLowerCase()).toContain('perspective')
    expect(q.toLowerCase()).toContain('art reference')
    expect(q).not.toContain('Перспектива')
  })
})
