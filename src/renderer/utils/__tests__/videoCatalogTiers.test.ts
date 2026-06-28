import { describe, expect, it } from 'vitest'
import type { VideoResource } from '@/data/videoResources'
import {
  filterTagSuggestions,
  partitionStartHereCatalog,
  scoreStartHereVideo,
  sortCatalogFavoritesFirst,
} from '@/utils/videoCatalogTiers'
import { videoResourceMatchesFilters } from '@/data/videoResources'
import { buildQuestResourcesSearchParams } from '@/utils/questResourcesUrl'

const sampleCore: VideoResource = {
  id: 'drawlikeasir-roadmap',
  youtubeId: '1jjmOF1hQqI',
  titleEn: 'Learn to draw: roadmap (0 → advanced)',
  titleRu: 'Дорожная карта обучения рисунку',
  channelKey: 'drawlikeasir',
  category: 'drawing',
  nodeIds: ['drawing_fundamentals', 'drawing_practice'],
  tags: ['roadmap', 'fundamentals', 'lines'],
  chapters: [],
}

const sampleAuto: VideoResource = {
  id: 'auto-yt-drawing_fundamentals-abc',
  youtubeId: 'abc123',
  titleEn: 'Random advanced masterclass timelapse',
  titleRu: 'Random advanced masterclass timelapse',
  channelKey: 'youtube_curated_mix',
  category: 'drawing',
  nodeIds: ['drawing_fundamentals'],
  tags: ['lines', 'tutorial', 'youtube-prefetch'],
  chapters: [],
}

const sampleBeginnerAuto: VideoResource = {
  id: 'auto-yt-drawing_fundamentals-def',
  youtubeId: 'def456',
  titleEn: 'Drawing fundamentals for beginners — step by step',
  titleRu: 'Drawing fundamentals for beginners — step by step',
  channelKey: 'youtube_curated_mix',
  category: 'drawing',
  nodeIds: ['drawing_fundamentals'],
  tags: ['lines', 'tutorial', 'youtube-prefetch'],
  chapters: [],
}

describe('scoreStartHereVideo', () => {
  it('prefers hand-picked core and beginner titles over advanced auto picks', () => {
    const ctx = {
      category: 'drawing' as const,
      nodeId: 'drawing_fundamentals',
      nodeTags: ['lines', 'shapes'],
      preferredTags: ['drawing', 'novice'],
    }
    const coreScore = scoreStartHereVideo(sampleCore, ctx)
    const advScore = scoreStartHereVideo(sampleAuto, ctx)
    const begScore = scoreStartHereVideo(sampleBeginnerAuto, ctx)
    expect(coreScore).toBeGreaterThan(advScore)
    expect(begScore).toBeGreaterThan(advScore)
  })

  it('boosts favorited videos above other relevance signals', () => {
    const ctx = {
      category: 'drawing' as const,
      nodeId: 'drawing_fundamentals',
      nodeTags: ['lines', 'shapes'],
      preferredTags: [],
      favoriteIds: [sampleAuto.id],
    }
    const favScore = scoreStartHereVideo(sampleAuto, ctx)
    const coreScore = scoreStartHereVideo(sampleCore, ctx)
    expect(favScore).toBeGreaterThan(coreScore)
  })
})

describe('sortCatalogFavoritesFirst', () => {
  it('keeps favorites at the top without changing order within groups', () => {
    const ordered = sortCatalogFavoritesFirst(
      [sampleCore, sampleAuto, sampleBeginnerAuto],
      [sampleAuto.id, sampleBeginnerAuto.id],
    )
    expect(ordered.map((r) => r.id)).toEqual([sampleAuto.id, sampleBeginnerAuto.id, sampleCore.id])
  })
})

describe('partitionStartHereCatalog', () => {
  it('fills Start here with scored picks when a node is selected', () => {
    const { startHere, extended } = partitionStartHereCatalog(
      [sampleAuto, sampleBeginnerAuto, sampleCore],
      {
        category: 'drawing',
        nodeId: 'drawing_fundamentals',
        nodeTags: ['lines', 'shapes'],
        preferredTags: ['novice'],
      },
    )
    expect(startHere.length).toBe(3)
    expect(startHere.some((r) => r.id === sampleCore.id)).toBe(true)
    expect(startHere.some((r) => r.id === sampleBeginnerAuto.id)).toBe(true)
    expect(startHere.some((r) => r.id === sampleAuto.id)).toBe(true)
    expect(extended.length).toBe(0)
  })
})

describe('buildQuestResourcesSearchParams', () => {
  it('sets category, node, and all quest tags without strict single-tag filter', () => {
    const qs = buildQuestResourcesSearchParams({
      category: 'drawing',
      tags: ['coloring', 'layers', 'digital'],
    })
    const p = new URLSearchParams(qs)
    expect(p.get('category')).toBe('drawing')
    expect(p.get('node')).toBeTruthy()
    expect(p.get('tags')).toBe('coloring,layers,digital')
    expect(p.get('tag')).toBeNull()
  })
})

describe('filterTagSuggestions', () => {
  it('matches partial tag names', () => {
    expect(filterTagSuggestions(['perspective', 'fundamentals'], 'perspect')).toEqual(['perspective'])
  })
})

describe('videoResourceMatchesFilters tag', () => {
  it('matches tags case-insensitively', () => {
    expect(
      videoResourceMatchesFilters(sampleCore, {
        category: 'all',
        nodeId: null,
        tag: 'FUNDAMENTALS',
        search: '',
      }),
    ).toBe(true)
  })
})
