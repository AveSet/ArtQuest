import { describe, expect, it } from 'vitest'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import {
  buildShortsQueryResources,
  isShortsQueryResource,
  shortsSearchQueryForResource,
} from '@/utils/videoCatalogShorts'

describe('videoCatalogShorts', () => {
  it('builds one row per node search query', () => {
    const node = SKILL_TREE_NODES.find((n) => n.id === 'anatomy_hands')
    expect(node).toBeDefined()
    const rows = buildShortsQueryResources([node!])
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows.length).toBeLessThanOrEqual(3)
    expect(rows.every(isShortsQueryResource)).toBe(true)
    expect(rows[0].tags).toContain('shorts')
    expect(shortsSearchQueryForResource(rows[0])).toMatch(/#shorts$/i)
  })
})
