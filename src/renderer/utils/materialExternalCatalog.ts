import type { Language } from '@/i18n/languages'
import type { VideoResource } from '@/data/videoResources'
import type { QuestCategory } from '@/data/skillTree'
import {
  buildMaterialTagSearchQueries,
  EXTERNAL_MATERIAL_SEARCH_LANG,
  type MaterialTagSearchContext,
} from '@/utils/materialTagSearchQueries'
import type { NodeYoutubeSearchInput } from '@/utils/nodeYoutubeSearchQueries'

export type MaterialVideoMode = 'long' | 'short' | 'clipTips' | 'sketchfab' | 'pinterest'

const MATERIAL_VIDEO_MODES: MaterialVideoMode[] = ['long', 'short', 'clipTips', 'sketchfab', 'pinterest']

export function parseMaterialVideoMode(raw: string | null): MaterialVideoMode | null {
  if (raw && (MATERIAL_VIDEO_MODES as string[]).includes(raw)) return raw as MaterialVideoMode
  return null
}

/** External site search (Pinterest, CSP Tips, Sketchfab) — no in-app video list. */
export function isExternalSiteMaterialMode(mode: MaterialVideoMode): boolean {
  return mode === 'pinterest' || mode === 'clipTips' || mode === 'sketchfab'
}

const EXTERNAL_CHAPTER = [{ labelEn: 'Open in browser', labelRu: 'Открыть в браузере', startSec: 0 }]

export type SkillNodeForExternalSearch = NodeYoutubeSearchInput & { id: string }

export function clipStudioTipsSearchUrl(query: string): string {
  const q = encodeURIComponent(String(query ?? '').trim())
  return `https://tips.clip-studio.com/en-us/search?word=${q}`
}

export function sketchfabSearchUrl(query: string): string {
  const q = encodeURIComponent(String(query ?? '').trim())
  return `https://sketchfab.com/search?q=${q}&type=models&sort_by=relevance`
}

export function pinterestSearchUrl(query: string): string {
  const q = encodeURIComponent(String(query ?? '').trim())
  return `https://www.pinterest.com/search/pins/?q=${q}`
}

export function isClipTipsQueryResource(r: VideoResource): boolean {
  return r.id.startsWith('clip-tips-query-')
}

export function isSketchfabQueryResource(r: VideoResource): boolean {
  return r.id.startsWith('sketchfab-query-')
}

export function isPinterestQueryResource(r: VideoResource): boolean {
  return r.id.startsWith('pinterest-query-')
}

export function isExternalQueryResource(r: VideoResource): boolean {
  return isClipTipsQueryResource(r) || isSketchfabQueryResource(r) || isPinterestQueryResource(r)
}

export function externalSearchUrlForResource(r: VideoResource, _lang: Language): string | null {
  const q = r.channelLabelOverride?.trim()
  if (!q) return null
  if (isClipTipsQueryResource(r)) return clipStudioTipsSearchUrl(q)
  if (isSketchfabQueryResource(r)) return sketchfabSearchUrl(q)
  if (isPinterestQueryResource(r)) return pinterestSearchUrl(q)
  return null
}

function buildExternalQueryResources(
  prefix: 'clip-tips' | 'sketchfab' | 'pinterest',
  tag: 'clip-studio-tips' | 'sketchfab' | 'pinterest',
  channelLabelEn: string,
  channelLabelRu: string,
  nodes: SkillNodeForExternalSearch[],
  ctx: Omit<MaterialTagSearchContext, 'node'>,
): VideoResource[] {
  const targets = nodes.length > 0 ? nodes : [null]
  const rows: VideoResource[] = []

  const externalLang =
    prefix === 'clip-tips' || prefix === 'sketchfab' ? EXTERNAL_MATERIAL_SEARCH_LANG : (ctx.lang ?? 'en')

  const site: 'clipTips' | 'sketchfab' | 'pinterest' =
    prefix === 'clip-tips' ? 'clipTips' : prefix === 'sketchfab' ? 'sketchfab' : 'pinterest'

  for (const node of targets) {
    const queries = buildMaterialTagSearchQueries(
      {
        ...ctx,
        lang: externalLang,
        preferredTags: ctx.preferredTags ?? [],
        search: ctx.search ?? '',
        node: node
          ? { category: node.category, title: node.title, tags: node.tags }
          : null,
      },
      site,
    )
    const category = (node?.category ?? ctx.category === 'all' ? 'drawing' : ctx.category) as QuestCategory
    const nodeIds = node ? [node.id] : []

    for (const [qi, q] of queries.entries()) {
      const nodeKey = node?.id ?? 'all'
      rows.push({
        id: `${prefix}-query-${nodeKey}-${qi}`,
        youtubeId: '',
        titleEn: `${channelLabelEn} · ${q}`,
        titleRu: `${channelLabelRu} · ${q}`,
        channelKey: 'youtube_curated_mix',
        category,
        nodeIds,
        tags: [tag, 'external-search', ...q.toLowerCase().split(/\s+/).slice(0, 4)],
        chapters: EXTERNAL_CHAPTER,
        channelLabelOverride: q,
      })
    }
  }

  return rows
}

export function buildClipStudioTipsQueryResources(
  nodes: SkillNodeForExternalSearch[],
  ctx: Omit<MaterialTagSearchContext, 'node'>,
): VideoResource[] {
  return buildExternalQueryResources(
    'clip-tips',
    'clip-studio-tips',
    'Clip Studio TIPS',
    'Clip Studio TIPS',
    nodes,
    ctx,
  )
}

export function buildSketchfabQueryResources(
  nodes: SkillNodeForExternalSearch[],
  ctx: Omit<MaterialTagSearchContext, 'node'>,
): VideoResource[] {
  return buildExternalQueryResources(
    'sketchfab',
    'sketchfab',
    'Sketchfab',
    'Sketchfab',
    nodes,
    ctx,
  )
}

export function buildPinterestQueryResources(
  nodes: SkillNodeForExternalSearch[],
  ctx: Omit<MaterialTagSearchContext, 'node'>,
): VideoResource[] {
  return buildExternalQueryResources(
    'pinterest',
    'pinterest',
    'Pinterest',
    'Pinterest',
    nodes,
    ctx,
  )
}
