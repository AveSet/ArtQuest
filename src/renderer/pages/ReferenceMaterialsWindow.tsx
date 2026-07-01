import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SKILL_TREE_NODES, type QuestCategory } from '@/data/skillTree'
import { parsePreferredTagsFromSearchParams } from '@/utils/videoCatalogTiers'
import { EXTERNAL_MATERIAL_SEARCH_LANG } from '@/utils/materialTagSearchQueries'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { resolveQuestSkillNodeId } from '@/utils/resolveQuestSkillNode'
import { parseMaterialVideoMode, type MaterialVideoMode } from '@/utils/materialExternalCatalog'
import { getReferenceYoutubeButtonLabels } from '@/utils/referenceYtLabels'
import {
  buildReferenceQuery,
  buildReferenceSourceUrl,
  isReferenceSource,
  normalizeReferenceSource,
  REFERENCE_SOURCES,
} from '@/utils/buildReferenceQuery'
import { buildCompositeMaterialSearchQuery } from '@/utils/materialTagSearchQueries'
import type { ReferenceSource } from '@/store/models'
import type { Language } from '@/i18n/translations'
import { initViewportHeightSync } from '@/utils/viewportHeight'
import { bindReferencePinterestUiCleanupOnDomReady } from '@/utils/referencePinterestUiCleanup'
import type { ReferenceWebviewEl } from '@/utils/referenceGoogleLogin'

const REFERENCE_WEBVIEW_PARTITION = 'persist:artquest-reference'
const REFERENCE_SOURCE_STORAGE_KEY = 'artquest:preferredReferenceSource'

function resolveContextFromParams(
  searchParams: URLSearchParams,
  quests: ReturnType<typeof useQuestStore.getState>['quests'],
) {
  const mode = parseMaterialVideoMode(searchParams.get('mode')) ?? 'long'
  const sourceParam = searchParams.get('source')
  const source = isReferenceSource(sourceParam) ? normalizeReferenceSource(sourceParam) : null
  const questIdRaw = searchParams.get('questId')
  const questId = questIdRaw ? parseInt(questIdRaw, 10) : null
  const quest = questId != null ? quests.find((q) => q.id === questId) : null
  const nodeFromUrl = searchParams.get('node') ?? ''
  const nodeId = nodeFromUrl || (quest ? resolveQuestSkillNodeId(quest) : '')
  const category = (searchParams.get('category') as QuestCategory | 'all' | null) ?? quest?.category ?? 'all'
  const preferredTags = parsePreferredTagsFromSearchParams(searchParams)
  const tags = preferredTags.length > 0 ? preferredTags : (quest?.tags ?? [])
  const selectedNode = nodeId ? SKILL_TREE_NODES.find((n) => n.id === nodeId) ?? null : null
  return { mode, source, quest, nodeId, category, tags, selectedNode, preferredTags: tags, questTitle: quest?.title ?? null }
}

function sourceFromLegacyMode(mode: MaterialVideoMode): ReferenceSource {
  if (mode === 'pinterest') return 'pinterest'
  if (mode === 'sketchfab') return 'sketchfab'
  if (mode === 'clipTips') return 'clipTips'
  if (mode === 'short') return 'youtube_short'
  return 'youtube'
}

function readStoredReferenceSource(): ReferenceSource | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(REFERENCE_SOURCE_STORAGE_KEY)
    return isReferenceSource(raw) ? normalizeReferenceSource(raw) : null
  } catch {
    return null
  }
}

function persistStoredReferenceSource(source: ReferenceSource): void {
  try {
    window.localStorage.setItem(REFERENCE_SOURCE_STORAGE_KEY, source)
  } catch {
    /* ignore */
  }
}

function contextualSiteForSource(source: ReferenceSource): 'pinterest' | 'youtube' | 'sketchfab' | 'clipTips' {
  if (source === 'sketchfab') return 'sketchfab'
  if (source === 'clipTips') return 'clipTips'
  if (source === 'youtube' || source === 'youtube_short') return 'youtube'
  return 'pinterest'
}

export default function ReferenceMaterialsWindow() {
  const [searchParams] = useSearchParams()
  const { t, language } = useI18n()
  const lang = (searchParams.get('lang') as Language | null) ?? language
  const quests = useQuestStore((s) => s.quests)
  const preferredReferenceSource = useUIStore((s) => s.settings.preferredReferenceSource)
  const setSettings = useUIStore((s) => s.setSettings)
  const saveProgress = useUIStore((s) => s.saveProgress)

  const ctx = useMemo(() => resolveContextFromParams(searchParams, quests), [searchParams, quests])
  const initialSource = useMemo(
    () =>
      ctx.source ??
      (preferredReferenceSource ? normalizeReferenceSource(preferredReferenceSource) : null) ??
      readStoredReferenceSource() ??
      sourceFromLegacyMode(ctx.mode),
    [ctx.mode, ctx.source, preferredReferenceSource],
  )
  const [selectedSource, setSelectedSource] = useState<ReferenceSource>(initialSource)
  const [sourceUrls, setSourceUrls] = useState<Partial<Record<ReferenceSource, string>>>({})
  const [visitedSources, setVisitedSources] = useState<ReferenceSource[]>([initialSource])
  const [isPaneLoading, setIsPaneLoading] = useState(true)
  const webviewRefs = useRef<Partial<Record<ReferenceSource, ReferenceWebviewEl | null>>>({})

  useEffect(() => {
    setSelectedSource(initialSource)
  }, [initialSource])

  const externalQueryLang =
    selectedSource === 'sketchfab' || selectedSource === 'clipTips'
      ? EXTERNAL_MATERIAL_SEARCH_LANG
      : lang

  const defaultSearch = useMemo(() => {
    if (ctx.quest) {
      return buildReferenceQuery(ctx.quest, selectedSource)
    }
    return buildCompositeMaterialSearchQuery(
      {
        node: ctx.selectedNode
          ? { category: ctx.selectedNode.category, title: ctx.selectedNode.title, tags: ctx.selectedNode.tags }
          : null,
        tag: null,
        preferredTags: ctx.preferredTags ?? [],
        search: '',
        category: ctx.category,
        lang: externalQueryLang,
        questTitle: ctx.questTitle,
      },
      contextualSiteForSource(selectedSource),
    )
  }, [ctx, externalQueryLang, selectedSource])

  const [search, setSearch] = useState(defaultSearch)

  useEffect(() => {
    setSearch(defaultSearch)
  }, [defaultSearch, selectedSource, ctx.quest?.id, ctx.nodeId])

  useEffect(() => {
    document.documentElement.setAttribute('data-reference-window', '1')
    const stopVh = initViewportHeightSync()
    const unsub = window.electronAPI?.reference?.onNavigate?.((url) => {
      setSourceUrls((prev) => ({ ...prev, [selectedSource]: url }))
    })
    return () => {
      document.documentElement.removeAttribute('data-reference-window')
      stopVh()
      unsub?.()
    }
  }, [selectedSource])

  const defaultSiteUrl = useMemo(() => {
    const manual = search.trim()
    const query = manual || (ctx.quest ? buildReferenceQuery(ctx.quest, selectedSource) : defaultSearch)
    return buildReferenceSourceUrl(selectedSource, query)
  }, [ctx.quest, defaultSearch, search, selectedSource])

  useEffect(() => {
    setSourceUrls((prev) => ({ ...prev, [selectedSource]: defaultSiteUrl }))
    setVisitedSources((prev) => (prev.includes(selectedSource) ? prev : [...prev, selectedSource]))
  }, [defaultSiteUrl, selectedSource])

  useEffect(() => {
    setIsPaneLoading(true)
    const timeoutId = window.setTimeout(() => setIsPaneLoading(false), 900)
    return () => window.clearTimeout(timeoutId)
  }, [defaultSiteUrl, selectedSource])

  const ytLabels = getReferenceYoutubeButtonLabels(lang)
  const sourceLabel: Record<ReferenceSource, string> = {
    pinterest: t.resources.referenceSourcePinterest ?? t.quests.referencePinterest ?? 'Pinterest',
    youtube: t.resources.referenceSourceYoutube ?? ytLabels.long,
    youtube_short: t.resources.referenceSourceYoutubeShort ?? ytLabels.short,
    sketchfab: t.resources.referenceSourceSketchfab ?? t.quests.referenceSketchfab ?? 'Sketchfab',
    clipTips: t.resources.referenceSourceClipTips ?? t.quests.referenceClipTips ?? 'CSP Tips',
    google: t.resources.referenceSourceGoogle ?? 'Google Images',
  }
  const sourceIcon: Record<ReferenceSource, string> = {
    pinterest: 'Pin',
    youtube: 'Video',
    youtube_short: 'Short',
    sketchfab: '3D',
    clipTips: 'CSP',
    google: 'Img',
  }

  const paneUrl = defaultSiteUrl

  useEffect(() => {
    const webview = webviewRefs.current[selectedSource]
    const cleanupPinterest = bindReferencePinterestUiCleanupOnDomReady(webview, selectedSource)
    return () => {
      cleanupPinterest()
    }
  }, [selectedSource, paneUrl])

  const selectSource = (source: ReferenceSource) => {
    if (source === selectedSource) return
    setSelectedSource(source)
    persistStoredReferenceSource(source)
    setSettings({ preferredReferenceSource: source })
    void saveProgress()
  }

  return (
    <div className="reference-materials-window">
      <header className="reference-toolbar">
        <div
          className="reference-toolbar__sources"
          role="tablist"
          aria-label={t.resources.referenceSourceSelector ?? 'Reference source'}
        >
          {REFERENCE_SOURCES.map((source) => (
            <button
              key={source}
              type="button"
              role="tab"
              aria-selected={selectedSource === source}
              className={`btn-secondary reference-toolbar__source-btn transition-opacity ${
                selectedSource === source ? 'border-[var(--accent)] text-[var(--accent)]' : ''
              }`}
              onClick={() => selectSource(source)}
            >
              <span aria-hidden>{sourceIcon[source]}</span> {sourceLabel[source]}
            </button>
          ))}
        </div>
        <div className="reference-toolbar__search-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.resources.refWindowSearchPlaceholder ?? 'Search topic…'}
            className="reference-toolbar__search"
          />
          <button
            type="button"
            className="btn-secondary reference-toolbar__action"
            onClick={() => {
              setSourceUrls((prev) => ({ ...prev, [selectedSource]: defaultSiteUrl }))
            }}
          >
            {t.resources.refWindowSearch ?? 'Search'}
          </button>
          <button
            type="button"
            className="btn-secondary reference-toolbar__action"
            onClick={() => void window.electronAPI?.shell?.openExternal?.(paneUrl)}
          >
            {t.resources.refWindowOpenExternal ?? 'Open externally'}
          </button>
        </div>
      </header>

      <div className="reference-materials-body">
        <div className="reference-webview-pane">
          {paneUrl ? (
            <div className="reference-webview-pane__inner">
              {visitedSources.map((source) => {
                const url = source === selectedSource ? paneUrl : sourceUrls[source]
                if (!url) return null
                return (
                  <webview
                    key={source}
                    ref={(el) => {
                      webviewRefs.current[source] = el as ReferenceWebviewEl | null
                    }}
                    // eslint-disable-next-line react/no-unknown-property -- Electron webview attribute
                    partition={REFERENCE_WEBVIEW_PARTITION}
                    src={url}
                    className={`absolute inset-0 w-full h-full${source === selectedSource ? '' : ' hidden'}`}
                  />
                )
              })}
              {isPaneLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80 text-sm text-[var(--text-muted)] transition-opacity">
                  {t.resources.refWindowPaneLoading ?? 'Loading search…'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)] p-8 text-center">
              {t.resources.refWindowPaneLoading ?? 'Loading search…'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
