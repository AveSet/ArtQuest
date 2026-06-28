import { describe, expect, it } from 'vitest'
import { resolveQuestSkillNodeId } from '@/utils/resolveQuestSkillNode'

describe('resolveQuestSkillNodeId', () => {
  it('matches tags to the best skill node', () => {
    const id = resolveQuestSkillNodeId({
      category: 'drawing',
      tags: ['perspective', 'depth'],
    })
    expect(id).toBe('drawing_perspective')
  })

  it('falls back to category fundamentals when no tag overlap', () => {
    const id = resolveQuestSkillNodeId({
      category: 'anatomy',
      tags: ['unknown-tag'],
    })
    expect(id).toBe('anatomy_fundamentals')
  })
})
