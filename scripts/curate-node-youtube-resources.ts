/**
 * Rebuild src/renderer/data/autoCuratedYoutubeResources.ts from InnerTube search.
 * For each skill node: runs the three Global YouTube Search query strings IN ORDER,
 * filling up to TARGET_UNIQUE_VIDEOS (30) long-form UNIQUE videos total — repeats across
 * queries are skipped (#shorts & <2min filtered elsewhere).
 *
 * While picking: prefers skipping ids already pinned on this node in CORE_VIDEO_RESOURCES,
 * falling back deeper in SERP continuation pages inside each query slice.
 *
 * Usage: npm run curate:node-youtube [-- --maxNodes=N] [-- --node=anatomy_hands]
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Innertube from 'youtubei.js'
import { YTNodes } from 'youtubei.js'

import type { QuestCategory } from '../src/renderer/data/skillTree.ts'
import { SKILL_TREE_NODES } from '../src/renderer/data/skillTree.ts'
import { buildNodeYoutubeSearchQueries } from '../src/renderer/utils/nodeYoutubeSearchQueries.ts'
import type { VideoResource } from '../src/renderer/data/videoResources.ts'
import { dedupeAutoCuratedRows } from './youtubeResourceDedupe.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, '../src/renderer/data/autoCuratedYoutubeResources.ts')

const MIN_DURATION_SEC = 120
/** Max unique prefetched rows per skill node across all three search strings. */
const TARGET_UNIQUE_VIDEOS = 30
const MAX_PAGES_PER_QUERY = 10

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function titleText(node: InstanceType<typeof YTNodes.Video> | InstanceType<typeof YTNodes.CompactVideo>): string {
  const t = node.title
  const raw = typeof t?.text === 'string' ? t.text : ''
  return raw.replace(/\s+/g, ' ').trim()
}

function discardAsShort(seconds: number, title: string): boolean {
  if (!Number.isFinite(seconds) || seconds < MIN_DURATION_SEC) return true
  const t = title.toLowerCase()
  if (/(^|\s)#\s*shorts\b/.test(t)) return true
  if (/\b#shorts\b/.test(t)) return true
  return false
}

type PickedVideo = {
  youtubeId: string
  title: string
  seconds: number
}

function coreYoutubeIdsByNode(core: Pick<VideoResource, 'youtubeId' | 'nodeIds'>[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>()
  for (const v of core) {
    for (const nid of v.nodeIds) {
      let s = m.get(nid)
      if (!s) {
        s = new Set<string>()
        m.set(nid, s)
      }
      s.add(v.youtubeId)
    }
  }
  return m
}

async function pickFromQuery(
  yt: InstanceType<typeof Innertube>,
  query: string,
  excludeWithinRun: Set<string>,
  blockedForNodeCore: ReadonlySet<string>,
  alreadyTakenOnNodeGlobal: ReadonlySet<string>,
  want: number,
): Promise<PickedVideo[]> {
  const out: PickedVideo[] = []
  let pages = 0
  let search = await yt.search(query, { type: 'video' })

  outer: while (out.length < want && search && pages < MAX_PAGES_PER_QUERY) {
    for (const item of search.results) {
      if (!item.is(YTNodes.Video, YTNodes.CompactVideo)) continue
      if ('is_live' in item && item.is_live) continue
      const vid = item.video_id
      if (!vid || excludeWithinRun.has(vid)) continue
      if (alreadyTakenOnNodeGlobal.has(vid)) continue
      if (blockedForNodeCore.has(vid)) continue
      const title = titleText(item)
      if (!title) continue
      const seconds = item.duration.seconds
      if (discardAsShort(seconds, title)) continue
      out.push({ youtubeId: vid, title, seconds })
      excludeWithinRun.add(vid)
      if (out.length >= want) break outer
    }

    pages += 1
    try {
      search = await search.getContinuation()
    } catch {
      break
    }
    await sleep(450)
  }
  return out
}

type FlatRow = {
  youtubeId: string
  titleEn: string
  titleRu: string
  category: QuestCategory
  skillNodeId: string
  tags: string[]
}

function parseArgs() {
  const raw = process.argv.slice(2)
  let maxNodes: number | null = null
  let singleNode: string | null = null
  for (const a of raw) {
    const mNodes = /^--maxNodes=(\d+)$/.exec(a)
    if (mNodes) maxNodes = Math.max(1, Number(mNodes[1]))
    const mNode = /^--node=(.+)$/.exec(a)
    if (mNode) singleNode = mNode[1]
  }
  return { maxNodes, singleNode }
}

async function main(): Promise<void> {
  const { CORE_VIDEO_RESOURCES } = await import('../src/renderer/data/videoResources.ts')
  const coreBlocked = coreYoutubeIdsByNode(CORE_VIDEO_RESOURCES)

  const { maxNodes, singleNode } = parseArgs()
  let nodes = SKILL_TREE_NODES
  if (singleNode) nodes = nodes.filter((n) => n.id === singleNode)
  if (!nodes.length) {
    console.error('No matching skill nodes.')
    process.exitCode = 1
    return
  }
  if (maxNodes != null) nodes = nodes.slice(0, maxNodes)

  console.warn(
    `Searching YouTube (${nodes.length} skill nodes × 3 sequential queries → up to ${TARGET_UNIQUE_VIDEOS} UNIQUE long-form IDs each).`,
  )

  const yt = await Innertube.create()

  const flat: FlatRow[] = []

  let i = 0
  for (const node of nodes) {
    i += 1
    const qs = buildNodeYoutubeSearchQueries(node)
    const blocked = coreBlocked.get(node.id) ?? new Set<string>()
    while (qs.length < 3) qs.push(`${node.title.en} tutorial`)

    const pickedOnNode = new Set<string>()

    for (const query of qs) {
      if (pickedOnNode.size >= TARGET_UNIQUE_VIDEOS) break
      const need = TARGET_UNIQUE_VIDEOS - pickedOnNode.size
      const excludeThisRun = new Set<string>()
      await sleep(550)
      const batch = await pickFromQuery(
        yt,
        query,
        excludeThisRun,
        blocked,
        pickedOnNode,
        need,
      )
      for (const p of batch) {
        pickedOnNode.add(p.youtubeId)
        flat.push({
          youtubeId: p.youtubeId,
          titleEn: p.title.slice(0, 220),
          titleRu: p.title.slice(0, 220),
          category: node.category,
          skillNodeId: node.id,
          tags: [...new Set([...node.tags.slice(0, 12), 'tutorial', 'youtube-prefetch'])].slice(0, 14),
        })
      }
    }
    console.warn(`… ${i}/${nodes.length} ${node.id} (${flat.length} rows total)`)
  }

  const { kept, removedPair } = dedupeAutoCuratedRows(flat)
  if (removedPair > 0) {
    console.warn(`[curate] Removed ${removedPair} duplicate youtubeId+skillNodeId rows before write.`)
  }

  const body = [
    '/**',
    ' * AUTO-GENERATED — `npm run curate:node-youtube`',
    ' * Up to 30 UNIQUE long-form videos per skill node (deduped per skillNodeId+youtubeId).',
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
  console.warn(`Wrote ${kept.length} rows → ${path.relative(process.cwd(), OUTPUT)}`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
