import type { AutoCuratedYoutubeResource } from '../src/renderer/data/autoCuratedYoutubeResources.ts'

export function dedupeAutoCuratedRows(rows: AutoCuratedYoutubeResource[]) {
  const seenPair = new Set<string>()
  const globalIds = new Map<string, number>()
  const kept: AutoCuratedYoutubeResource[] = []
  let removedPair = 0

  for (const row of rows) {
    const id = row.youtubeId?.trim()
    if (!id) {
      removedPair += 1
      continue
    }
    globalIds.set(id, (globalIds.get(id) ?? 0) + 1)
    const pairKey = `${id}::${row.skillNodeId}`
    if (seenPair.has(pairKey)) {
      removedPair += 1
      continue
    }
    seenPair.add(pairKey)
    kept.push(row)
  }

  const globalDupes = [...globalIds.entries()].filter(([, n]) => n > 1).length

  return { kept, removedPair, globalDupes, inputCount: rows.length }
}
