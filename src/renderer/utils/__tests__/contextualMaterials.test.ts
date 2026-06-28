import { describe, it, expect } from 'vitest'
import { pickContextualMaterials } from '../contextualMaterials'
import type { VideoResource } from '@/data/videoResources'
import type { Quest } from '@/store/models'

const video = (partial: Partial<VideoResource> & Pick<VideoResource, 'id' | 'titleEn'>): VideoResource => ({
  youtubeId: 'abc',
  titleRu: partial.titleEn,
  channelKey: 'drawlikeasir',
  category: 'drawing',
  nodeIds: [],
  tags: [],
  chapters: [],
  ...partial,
})

const quest: Quest = {
  id: 1,
  code: 'Q-1',
  title: { en: 'Gesture', ru: 'G', zh: 'G', ja: 'G', ko: 'G' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 40,
  estimatedTime: 20,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: ['gesture', 'speed'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
}

describe('pickContextualMaterials', () => {
  const catalog: VideoResource[] = [
    video({
      id: 'theory-roadmap',
      titleEn: 'Drawing roadmap',
      tags: ['roadmap', 'fundamentals'],
      chapters: [{ labelEn: 'Intro', labelRu: 'Intro', startSec: 0 }],
    }),
    video({
      id: 'short-gesture',
      titleEn: 'Quick gesture tips',
      tags: ['short', 'gesture'],
    }),
    video({
      id: 'ref-study',
      titleEn: 'Reference study habits',
      tags: ['reference', 'study', 'gesture'],
    }),
    video({
      id: 'extra-gesture',
      titleEn: 'Gesture drills',
      tags: ['gesture', 'demo'],
    }),
  ]

  it('fills three distinct slots from a tagged drawing catalog', () => {
    const pack = pickContextualMaterials(catalog, { quest })
    expect(pack.primary).toBeTruthy()
    expect(pack.shortDemo).toBeTruthy()
    expect(pack.reference).toBeTruthy()
    const ids = [pack.primary!.id, pack.shortDemo!.id, pack.reference!.id]
    expect(new Set(ids).size).toBe(3)
    expect(pack.reference!.tags.some((t) => ['reference', 'study', 'copy'].includes(t))).toBe(true)
  })

  it('boosts applied engagement when ranking primary slot', () => {
    const pack = pickContextualMaterials(catalog, {
      quest,
      materialEngagement: {
        'short-gesture': 'applied',
        'theory-roadmap': 'viewed',
      },
    })
    expect(pack.primary?.id).toBe('short-gesture')
  })

  it('prefers node-matched resources when nodeId is provided', () => {
    const withNode = [
      ...catalog,
      video({
        id: 'node-specific',
        titleEn: 'Fundamentals node drill',
        nodeIds: ['drawing_fundamentals'],
        tags: ['fundamentals'],
        chapters: [{ labelEn: 'A', labelRu: 'A', startSec: 0 }],
      }),
    ]
    const pack = pickContextualMaterials(withNode, {
      quest,
      nodeId: 'drawing_fundamentals',
    })
    expect(pack.primary?.id).toBe('node-specific')
  })
})
