/** YouTube watch URL with optional start offset (seconds). */
export function youtubeWatchUrl(videoId: string, startSec = 0): string {
  const base = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  if (startSec <= 0) return base
  return `${base}&t=${Math.floor(startSec)}s`
}

/** YouTube Shorts URL (no timestamp support). */
export function youtubeShortsUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${encodeURIComponent(videoId)}`
}

/**
 * YouTube search URL pre-filtered to Shorts.
 * Note: YouTube uses encoded `sp` params; this matches the public "Shorts" filter on results pages.
 */
export function youtubeShortsSearchUrl(query: string): string {
  const u = new URL('https://www.youtube.com/results')
  u.searchParams.set('search_query', query)
  u.searchParams.set('sp', 'EgIYAQ==')
  return u.toString()
}

/**
 * Embed URL for in-app preview (plain iframe; no IFrame API).
 * Use privacy-enhanced domain — works more reliably in Electron `file://` and strict embed contexts.
 */
export function youtubeEmbedUrl(videoId: string, startSec = 0): string {
  const u = new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`)
  if (startSec > 0) u.searchParams.set('start', String(Math.floor(startSec)))
  u.searchParams.set('rel', '0')
  u.searchParams.set('modestbranding', '1')
  u.searchParams.set('playsinline', '1')
  u.searchParams.set('origin', 'https://www.youtube.com')
  u.searchParams.set('enablejsapi', '1')
  return u.toString()
}

export function youtubeThumbnailUrl(videoId: string, quality: 'mq' | 'hq' = 'mq'): string {
  const d = quality === 'hq' ? 'hqdefault' : 'mqdefault'
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${d}.jpg`
}

export function youtubeSearchUrl(query: string): string {
  const u = new URL('https://www.youtube.com/results')
  u.searchParams.set('search_query', query)
  return u.toString()
}

export function formatTimestamp(startSec: number): string {
  const s = Math.max(0, Math.floor(startSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

/** Extract YouTube video id from common watch / embed / shorts URLs; returns null if not recognized. */
export function parseYoutubeIdFromUrl(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`
    const u = new URL(withScheme)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0] ?? ''
      return YOUTUBE_ID_RE.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch' || u.pathname.startsWith('/watch/')) {
        const v = u.searchParams.get('v')
        if (v && YOUTUBE_ID_RE.test(v)) return v
      }
      const embed = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embed?.[1]) return embed[1]
      const shorts = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/)
      if (shorts?.[1]) return shorts[1]
      const live = u.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/)
      if (live?.[1]) return live[1]
    }
  } catch {
    return null
  }
  return null
}
