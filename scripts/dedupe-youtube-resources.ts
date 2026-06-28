/**
 * Deduplicate AUTO_CURATED_YOUTUBE_RESOURCES by (youtubeId + skillNodeId).
 *
 * Usage: npm run dedupe:youtube [-- --write]
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AUTO_CURATED_YOUTUBE_RESOURCES } from '../src/renderer/data/autoCuratedYoutubeResources.ts'
import { dedupeAutoCuratedRows } from './youtubeResourceDedupe.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, '../src/renderer/data/autoCuratedYoutubeResources.ts')

function parseArgs(): { write: boolean } {
  let write = false
  for (const a of process.argv.slice(2)) {
    if (a === '--write') write = true
  }
  return { write }
}

async function main(): Promise<void> {
  const { write } = parseArgs()
  const { kept, removedPair, globalDupes, inputCount } = dedupeAutoCuratedRows(
    AUTO_CURATED_YOUTUBE_RESOURCES,
  )

  console.warn(
    `[dedupe:youtube] ${inputCount} rows → ${kept.length} kept (${removedPair} duplicate node+id pairs removed, ${globalDupes} youtubeIds on multiple nodes)`,
  )

  if (!write) {
    console.warn('[dedupe:youtube] Dry run. Pass --write to update the file.')
    return
  }

  const body = [
    '/**',
    ' * AUTO-GENERATED — `npm run curate:node-youtube`',
    ' * Deduped by `npm run dedupe:youtube -- --write` (unique youtubeId per skillNodeId).',
    ' */',
    '',
    "import type { QuestCategory } from './skillTree'",
    '',
    'export type AutoCuratedYoutubeResource = {',
    '  youtubeId: string',
    '  titleEn: string',
    '  titleRu: string',
    '  category: QuestCategory',
    '  skillNodeId: string',
    '  tags: string[]',
    '}',
    '',
    `export const AUTO_CURATED_YOUTUBE_RESOURCES: AutoCuratedYoutubeResource[] = ${JSON.stringify(kept, null, 2)}`,
    '',
  ].join('\n')

  await fs.writeFile(OUTPUT, body, 'utf8')
  console.warn(`[dedupe:youtube] Wrote ${kept.length} rows → ${path.relative(process.cwd(), OUTPUT)}`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
