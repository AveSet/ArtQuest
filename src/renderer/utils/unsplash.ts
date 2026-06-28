const UNSPLASH_API = 'https://api.unsplash.com'
const FALLBACK_BASE = 'https://picsum.photos'
const UNSPLASH_ACCESS_KEY = ''

interface UnsplashPhoto {
   id: string
   urls: { small: string; regular: string; thumb: string }
   alt_description: string | null
   user: { name: string }
 }

 interface UnsplashSearchResult {
   results: UnsplashPhoto[]
   total: number
   total_pages: number
 }

function generateFallbackResults(query: string, count: number): UnsplashSearchResult {
  const seed = query.replace(/\s+/g, '-').toLowerCase() || 'art'
  const results: UnsplashPhoto[] = Array.from({ length: count }, (_, i) => ({
    id: `${seed}-${i + 1}`,
    urls: {
      small: `${FALLBACK_BASE}/seed/${seed}${i + 1}/400/300`,
      regular: `${FALLBACK_BASE}/seed/${seed}${i + 1}/800/600`,
      thumb: `${FALLBACK_BASE}/seed/${seed}${i + 1}/200/150`,
    },
    alt_description: `${query} reference ${i + 1}`,
    user: { name: 'Picsum' },
  }))
  return { results, total: count, total_pages: 1 }
}

export async function searchUnsplash(query: string, page = 1): Promise<UnsplashSearchResult> {
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const params = new URLSearchParams({ query, page: String(page), per_page: '20' })
      const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      })
      if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`)
      return res.json()
    } catch {
      return generateFallbackResults(query, 12)
    }
  }
  return generateFallbackResults(query, 12)
}

export function getPhotoUrl(photoId: string, width = 400, height = 300): string {
  return `${FALLBACK_BASE}/seed/${photoId}/${width}/${height}`
}
