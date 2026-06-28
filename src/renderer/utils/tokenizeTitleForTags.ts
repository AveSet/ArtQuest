/** Pull a few word-like tokens from a video title to enrich tag filters (no YouTube API). */
const STOP = new Set([
  'the',
  'and',
  'for',
  'you',
  'how',
  'this',
  'with',
  'from',
  'your',
  'that',
  'our',
  'are',
  'was',
  'про',
  'как',
  'для',
  'это',
  'или',
  'что',
  'вас',
  'все',
])

export function tokenizeTitleForTags(title: string, max = 5): string[] {
  const raw = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-zа-яё0-9]+/iu)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP.has(w))
  return [...new Set(raw)].slice(0, max)
}
