export interface YoutubeOembedPayload {
  title: string
  author_name?: string
}

/**
 * Public oEmbed JSON for YouTube (no API key). May fail from restrictive network/CORS;
 * callers should fall back to manual title.
 */
export async function fetchYoutubeOembedForUrl(watchOrCanonicalUrl: string): Promise<YoutubeOembedPayload | null> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchOrCanonicalUrl)}`
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string; author_name?: string }
    if (!data.title || typeof data.title !== 'string') return null
    return {
      title: data.title.trim(),
      author_name: typeof data.author_name === 'string' ? data.author_name.trim() : undefined,
    }
  } catch {
    return null
  }
}
