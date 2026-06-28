import { describe, it, expect } from 'vitest'
import { parseYoutubeIdFromUrl, youtubeWatchUrl, youtubeEmbedUrl } from '../youtubeLinks'

describe('parseYoutubeIdFromUrl', () => {
  const id = 'dQw4w9WgXcQ'

  it('parses watch URL', () => {
    expect(parseYoutubeIdFromUrl(`https://www.youtube.com/watch?v=${id}`)).toBe(id)
  })

  it('parses youtu.be', () => {
    expect(parseYoutubeIdFromUrl(`https://youtu.be/${id}`)).toBe(id)
  })

  it('parses shorts URL', () => {
    expect(parseYoutubeIdFromUrl(`https://www.youtube.com/shorts/${id}`)).toBe(id)
  })

  it('parses embed URL', () => {
    expect(parseYoutubeIdFromUrl(`https://www.youtube.com/embed/${id}`)).toBe(id)
  })

  it('returns null for non-youtube', () => {
    expect(parseYoutubeIdFromUrl('https://example.com/video')).toBeNull()
  })
})

describe('youtubeWatchUrl', () => {
  it('builds watch URL with start', () => {
    expect(youtubeWatchUrl('abc', 90)).toContain('t=90s')
  })
})

describe('youtubeEmbedUrl', () => {
  it('builds standard embed URL with origin for restricted contexts', () => {
    const url = youtubeEmbedUrl('dQw4w9WgXcQ', 0)
    expect(url).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(url).toContain('origin=https')
  })
})
