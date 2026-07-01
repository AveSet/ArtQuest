import { useMemo, useState, useEffect, useId, useDeferredValue } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDebouncedValue } from '@/utils/useDebouncedValue'
import { useSearchParams } from 'react-router'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import { SKILL_TREE_NODES, type QuestCategory } from '@/data/skillTree'
import { RESOURCE_CHANNELS, RESOURCE_CHANNEL_LIST } from '@/data/resourceChannels'
import {
  filterVideoResources,
  videoResourceMatchesFilters,
  tagsForCategory,
  dedupeVideoResourcesByYoutubeId,
  RESOURCE_CATALOG_DISPLAY_LIMIT,
  type VideoResource,
} from '@/data/videoResources'
import {
  partitionStartHereCatalog,
  parsePreferredTagsFromSearchParams,
  sortCatalogFavoritesFirst,
} from '@/utils/videoCatalogTiers'
import { useVideoCatalog } from '@/utils/useVideoCatalog'
import { loadExtendedVideoCatalog } from '@/utils/loadVideoCatalog'
import VirtualizedCatalogGrid, { CATALOG_VIRTUALIZE_THRESHOLD } from '@/components/resources/VirtualizedCatalogGrid'
import MaterialSourceModeButtons from '@/components/resources/MaterialSourceModeButtons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TagFilterCombobox from '@/components/resources/TagFilterCombobox'
import { useI18n, getCategoryLabel, getLocalizedTitle } from '@/i18n'
import { getVideoResourceTitle } from '@/utils/videoResourceTitle'
import { getReferenceYoutubeButtonLabels } from '@/utils/referenceYtLabels'
import {
  youtubeWatchUrl,
  youtubeShortsUrl,
  youtubeThumbnailUrl,
  youtubeLongSearchUrl,
  youtubeShortsSearchUrl,
  parseYoutubeIdFromUrl,
} from '@/utils/youtubeLinks'
import { buildNodeYoutubeSearchQueries } from '@/utils/nodeYoutubeSearchQueries'
import { sortByExternalRelevance } from '@/utils/materialQueryRanking'
import { openExternalUrl } from '@/utils/openExternalUrl'
import { useUIStore } from '@/store/useUIStore'
import type { MaterialCustomLink } from '@/store/models'
import { materialYouTubeLinkToVideoResource, buildMaterialVideoTags } from '@/utils/materialVideoFromLink'
import { fetchYoutubeOembedForUrl } from '@/utils/youtubeOembed'
import {
  buildShortsQueryResources,
  isShortsQueryResource,
  isShortsTaggedResource,
  shortsSearchQueryForResource,
} from '@/utils/videoCatalogShorts'
import { pickContextualMaterials } from '@/utils/contextualMaterials'
import { useQuestStore } from '@/store/useQuestStore'
import { collectLearningFocusTags } from '@/utils/learningFocus'
import {
  buildClipStudioTipsQueryResources,
  buildPinterestQueryResources,
  buildSketchfabQueryResources,
  clipStudioTipsSearchUrl,
  externalSearchUrlForResource,
  isClipTipsQueryResource,
  isPinterestQueryResource,
  isSketchfabQueryResource,
  parseMaterialVideoMode,
  pinterestSearchUrl,
  sketchfabSearchUrl,
  type MaterialVideoMode,
} from '@/utils/materialExternalCatalog'
import { playUiClick } from '@/utils/sound'
import { useMaterialEngagement } from '@/utils/useMaterialEngagement'
import MaterialEngagementChips from '@/components/resources/MaterialEngagementChips'
import LearnModeEngagementHint from '@/components/resources/LearnModeEngagementHint'

export default function Resources() {
  const idPrefix = useId()
  const { t, language } = useI18n()
  const ytLabels = getReferenceYoutubeButtonLabels(language)
  const lang = language
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings, setSettings } = useUIStore(
    useShallow((s) => ({ settings: s.settings, setSettings: s.setSettings })),
  )
  const visibleCategories = useVisibleCategories()

  const materialFavoriteIds = useMemo(
    () => settings.materialFavoriteIds ?? [],
    [settings.materialFavoriteIds],
  )
  const materialCustomLinks = useMemo(
    () => settings.materialCustomLinks ?? [],
    [settings.materialCustomLinks],
  )
  const { materialEngagement, setMaterialEngagement } = useMaterialEngagement()
  const { questCompletionLogs, completedWorks } = useQuestStore(
    useShallow((s) => ({
      questCompletionLogs: s.questCompletionLogs,
      completedWorks: s.completedWorks,
    })),
  )

  const initialCategory = (searchParams.get('category') as QuestCategory | null) ?? 'all'
  const initialNode = searchParams.get('node') ?? ''
  const initialPreferredTags = parsePreferredTagsFromSearchParams(searchParams)
  const initialTag = searchParams.get('tag') ?? ''
  const initialView = searchParams.get('view') === 'learn' ? 'learn' : 'catalog'

  const [catalogView, setCatalogView] = useState<'learn' | 'catalog'>(initialView)

  const [category, setCategory] = useState<QuestCategory | 'all'>(
    initialCategory === 'all' || visibleCategories.includes(initialCategory as QuestCategory)
      ? (initialCategory as QuestCategory | 'all')
      : 'all',
  )
  const [nodeId, setNodeId] = useState<string | null>(initialNode || null)
  const [preferredTags, setPreferredTags] = useState<string[]>(initialPreferredTags)
  const [tag, setTag] = useState<string | null>(initialTag || null)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const filterOpts = useMemo(
    () => ({ category, nodeId, tag, search: debouncedQuery }),
    [category, nodeId, tag, debouncedQuery],
  )
  const deferredFilterOpts = useDeferredValue(filterOpts)
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(RESOURCE_CATALOG_DISPLAY_LIMIT)
  const catalogPageStep = 24
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkTitleInput, setLinkTitleInput] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [addVideoPanelOpen, setAddVideoPanelOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [showExtendedMaterials, setShowExtendedMaterials] = useState(false)
  const loadExtendedCatalog = showExtendedMaterials || debouncedQuery.trim().length > 0
  const { catalog, catalogLoading, catalogError, catalogExtendedLoading } = useVideoCatalog(loadExtendedCatalog)
  const [videoLengthMode, setVideoLengthMode] = useState<MaterialVideoMode>(
    () => parseMaterialVideoMode(searchParams.get('mode')) ?? 'long',
  )

  const externalSearchContext = useMemo(
    () => ({
      tag,
      preferredTags,
      search: debouncedQuery,
      category,
      lang,
    }),
    [tag, preferredTags, debouncedQuery, category, lang],
  )

  useEffect(() => {
    setCatalogView(searchParams.get('view') === 'learn' ? 'learn' : 'catalog')
  }, [searchParams])

  const learnFocusTags = useMemo(
    () =>
      collectLearningFocusTags({
        questCompletionLogs,
        completedWorks,
      }),
    [questCompletionLogs, completedWorks],
  )

  const learnPack = useMemo(() => {
    if (catalogView !== 'learn' || !catalog || catalog.length === 0) return null
    const tags = [...new Set([...preferredTags, ...(tag ? [tag] : []), ...learnFocusTags])]
    return pickContextualMaterials(catalog, {
      category,
      nodeId,
      preferredTags: tags,
      materialEngagement,
    })
  }, [catalogView, catalog, category, nodeId, preferredTags, tag, learnFocusTags, materialEngagement])

  const setCatalogViewMode = (mode: 'learn' | 'catalog') => {
    setCatalogView(mode)
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (mode === 'learn') p.set('view', 'learn')
        else p.delete('view')
        return p
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const c = searchParams.get('category')
    const n = searchParams.get('node')
    const tg = searchParams.get('tag')
    const fromQuestTags = parsePreferredTagsFromSearchParams(searchParams)
    if (c === 'all' || (c && visibleCategories.includes(c as QuestCategory))) {
      setCategory(c === 'all' || !c ? 'all' : (c as QuestCategory))
    }
    setNodeId(n && n.length > 0 ? n : null)
    setPreferredTags(fromQuestTags)
    setTag(tg && tg.length > 0 ? tg : null)
  }, [searchParams, visibleCategories])

  useEffect(() => {
    if (category !== 'all' && !visibleCategories.includes(category)) {
      setCategory('all')
      setNodeId(null)
    }
  }, [category, visibleCategories])

  const nodesInCategory = useMemo(() => {
    if (category === 'all') {
      return [...SKILL_TREE_NODES]
        .filter((n) => visibleCategories.includes(n.category))
        .sort((a, b) => {
        const ac = a.category.localeCompare(b.category)
        if (ac !== 0) return ac
        return a.order - b.order
      })
    }
    return SKILL_TREE_NODES.filter((n) => n.category === category).sort((a, b) => a.order - b.order)
  }, [category, visibleCategories])

  useEffect(() => {
    if (!nodeId) return
    if (!nodesInCategory.some((n) => n.id === nodeId)) {
      setNodeId(null)
      const p = new URLSearchParams(searchParams)
      p.delete('node')
      setSearchParams(p, { replace: true })
    }
  }, [category, nodeId, nodesInCategory, searchParams, setSearchParams])

  const tagOptions = useMemo(
    () => (catalog ? tagsForCategory(catalog, category) : []),
    [catalog, category],
  )
  const selectedNode = useMemo(
    () => (nodeId ? SKILL_TREE_NODES.find((n) => n.id === nodeId) ?? null : null),
    [nodeId],
  )
  const nodeSearchQueries = useMemo(() => {
    if (!selectedNode) return []
    return buildNodeYoutubeSearchQueries(selectedNode, {
      preferredTags,
      activeTag: tag,
      search: debouncedQuery,
      lang,
    })
  }, [selectedNode, preferredTags, tag, debouncedQuery, lang])

  const externalSearchNodes = useMemo(() => {
    return nodeId && selectedNode ? [selectedNode] : nodesInCategory
  }, [nodeId, selectedNode, nodesInCategory])

  useEffect(() => {
    setCatalogVisibleCount(RESOURCE_CATALOG_DISPLAY_LIMIT)
    setShowExtendedMaterials(false)
  }, [category, nodeId, tag, debouncedQuery, videoLengthMode])


  /** Eagerly load extended catalog when user searches or opens the full list. */
  useEffect(() => {
    if (catalogExtendedLoading && (debouncedQuery.trim().length > 0 || showExtendedMaterials)) {
      void loadExtendedVideoCatalog()
    }
  }, [catalogExtendedLoading, debouncedQuery, showExtendedMaterials])

  const isFilterPending = query !== debouncedQuery

  const shortsQueryCatalog = useMemo(() => {
    if (videoLengthMode !== 'short') return []
    return buildShortsQueryResources(externalSearchNodes)
  }, [videoLengthMode, externalSearchNodes])

  const clipTipsQueryCatalog = useMemo(() => {
    if (videoLengthMode !== 'clipTips') return []
    return buildClipStudioTipsQueryResources(externalSearchNodes, externalSearchContext)
  }, [videoLengthMode, externalSearchNodes, externalSearchContext])

  const sketchfabQueryCatalog = useMemo(() => {
    if (videoLengthMode !== 'sketchfab') return []
    return buildSketchfabQueryResources(externalSearchNodes, externalSearchContext)
  }, [videoLengthMode, externalSearchNodes, externalSearchContext])

  const pinterestQueryCatalog = useMemo(() => {
    if (videoLengthMode !== 'pinterest') return []
    return buildPinterestQueryResources(externalSearchNodes, externalSearchContext)
  }, [videoLengthMode, externalSearchNodes, externalSearchContext])

  const filteredCurated = useMemo(() => {
    if (videoLengthMode === 'clipTips') {
      return sortByExternalRelevance(
        filterVideoResources(clipTipsQueryCatalog, deferredFilterOpts),
        preferredTags,
        tag,
      )
    }
    if (videoLengthMode === 'sketchfab') {
      return sortByExternalRelevance(
        filterVideoResources(sketchfabQueryCatalog, deferredFilterOpts),
        preferredTags,
        tag,
      )
    }
    if (videoLengthMode === 'pinterest') {
      return sortByExternalRelevance(
        filterVideoResources(pinterestQueryCatalog, deferredFilterOpts),
        preferredTags,
        tag,
      )
    }
    if (videoLengthMode === 'short') {
      const queries = filterVideoResources(shortsQueryCatalog, deferredFilterOpts)
      const tagged = catalog
        ? filterVideoResources(catalog, deferredFilterOpts).filter(isShortsTaggedResource)
        : []
      return dedupeVideoResourcesByYoutubeId([...queries, ...tagged])
    }
    const filtered = catalog ? filterVideoResources(catalog, deferredFilterOpts) : []
    return filtered.filter((r) => !isShortsTaggedResource(r))
  }, [
    catalog,
    deferredFilterOpts,
    videoLengthMode,
    shortsQueryCatalog,
    clipTipsQueryCatalog,
    sketchfabQueryCatalog,
    pinterestQueryCatalog,
    preferredTags,
    tag,
  ])

  const userVideoResources = useMemo(() => {
    return materialCustomLinks
      .map(materialYouTubeLinkToVideoResource)
      .filter((r): r is VideoResource => r != null)
      .filter((r) => videoResourceMatchesFilters(r, deferredFilterOpts))
      .filter(() => videoLengthMode === 'long' || videoLengthMode === 'short')
      .filter((r) => (videoLengthMode === 'short' ? isShortsTaggedResource(r) : !isShortsTaggedResource(r)))
  }, [materialCustomLinks, deferredFilterOpts, videoLengthMode])

  const mergedCatalogSource = useMemo(() => {
    const curatedIds = new Set(filteredCurated.map((r) => r.youtubeId))
    const userOnly = userVideoResources.filter((u) => !curatedIds.has(u.youtubeId))
    /** User-added rows first so new uploads stay visible; curated fills after. Favorites still hoist via `curatedOrdered`. */
    return dedupeVideoResourcesByYoutubeId([...userOnly, ...filteredCurated])
  }, [filteredCurated, userVideoResources])

  const curatedOrdered = useMemo(
    () => sortCatalogFavoritesFirst(mergedCatalogSource, materialFavoriteIds),
    [mergedCatalogSource, materialFavoriteIds],
  )

  const { coreCatalog, extendedCatalog } = useMemo(() => {
    const ctx = {
      category,
      nodeId,
      nodeTags: selectedNode?.tags ?? [],
      preferredTags,
      favoriteIds: materialFavoriteIds,
    }
    const { startHere, extended } = partitionStartHereCatalog(curatedOrdered, ctx)
    return {
      coreCatalog: sortCatalogFavoritesFirst(startHere, materialFavoriteIds),
      extendedCatalog: sortCatalogFavoritesFirst(extended, materialFavoriteIds),
    }
  }, [curatedOrdered, category, nodeId, selectedNode, preferredTags, materialFavoriteIds])

  const splitCatalogTiers = nodeId != null && coreCatalog.length > 0

  const tieredCatalog = useMemo(() => {
    let list: VideoResource[]
    if (!splitCatalogTiers) list = curatedOrdered
    else list = showExtendedMaterials ? [...coreCatalog, ...extendedCatalog] : coreCatalog
    return sortCatalogFavoritesFirst(list, materialFavoriteIds)
  }, [
    splitCatalogTiers,
    showExtendedMaterials,
    coreCatalog,
    extendedCatalog,
    curatedOrdered,
    materialFavoriteIds,
  ])

  const catalogForDisplay = useMemo(
    () => tieredCatalog.slice(0, catalogVisibleCount),
    [tieredCatalog, catalogVisibleCount],
  )

  const catalogMatchTotal = tieredCatalog.length
  const useVirtualCatalog = tieredCatalog.length > CATALOG_VIRTUALIZE_THRESHOLD
  const catalogListItems = useVirtualCatalog ? tieredCatalog : catalogForDisplay
  const canLoadMoreCatalog = !useVirtualCatalog && catalogVisibleCount < catalogMatchTotal

  const legacyLinks = useMemo(
    () => materialCustomLinks.filter((l) => !l.skillNodeId || !l.youtubeId),
    [materialCustomLinks],
  )

  const syncUrl = (next: {
    category: QuestCategory | 'all'
    nodeId: string | null
    tag: string | null
    preferredTags?: string[]
  }) => {
    const p = new URLSearchParams()
    if (next.category !== 'all') p.set('category', next.category)
    if (next.nodeId) p.set('node', next.nodeId)
    if (next.preferredTags && next.preferredTags.length > 0) p.set('tags', next.preferredTags.join(','))
    if (next.tag) p.set('tag', next.tag)
    if (videoLengthMode !== 'long') p.set('mode', videoLengthMode)
    setSearchParams(p, { replace: true })
  }

  const setMaterialVideoMode = (mode: MaterialVideoMode) => {
    setVideoLengthMode(mode)
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (mode === 'long') p.delete('mode')
        else p.set('mode', mode)
        return p
      },
      { replace: true },
    )
  }

  const titleFor = (r: VideoResource) => getVideoResourceTitle(r, lang)

  const openCuratedInBrowser = (r: VideoResource) => {
    const externalUrl = externalSearchUrlForResource(r, lang)
    if (externalUrl) {
      void openExternalUrl(externalUrl)
      return
    }
    const shortsQuery = shortsSearchQueryForResource(r)
    if (shortsQuery) {
      void openExternalUrl(youtubeShortsSearchUrl(shortsQuery))
      return
    }
    if (videoLengthMode === 'short') {
      const url = isShortsTaggedResource(r)
        ? youtubeShortsUrl(r.youtubeId)
        : youtubeShortsSearchUrl(titleFor(r))
      void openExternalUrl(url)
      return
    }
    void openExternalUrl(youtubeWatchUrl(r.youtubeId, 0))
  }

  const toggleFavorite = (videoId: string) => {
    playUiClick()
    const next = materialFavoriteIds.includes(videoId)
      ? materialFavoriteIds.filter((id) => id !== videoId)
      : [...materialFavoriteIds, videoId]
    setSettings({ materialFavoriteIds: next })
  }

  const engagementChipLabels = {
    hint: t.resources.engagementHint ?? '',
    viewed: t.resources.engagementViewed ?? 'Viewed',
    helpful: t.resources.engagementHelpful ?? 'Helpful',
    applied: t.resources.engagementApplied ?? 'Applied',
  }

  const normalizeHttpUrl = (raw: string): string | null => {
    const s = raw.trim()
    if (!s) return null
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
      return u.toString()
    } catch {
      return null
    }
  }

  const addCustomVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinkError(null)
    if (!nodeId) {
      setLinkError(t.resources.addVideoNodeRequired)
      return
    }
    const normalized = normalizeHttpUrl(linkUrlInput)
    if (!normalized) {
      setLinkError(t.resources.invalidUrl)
      return
    }
    const yt = parseYoutubeIdFromUrl(normalized)
    if (!yt) {
      setLinkError(t.resources.addVideoYoutubeOnly)
      return
    }
    setAddSubmitting(true)
    try {
      const oembed = await fetchYoutubeOembedForUrl(normalized)
      const manual = linkTitleInput.trim()
      const displayTitle = manual || oembed?.title?.trim() || `YouTube · ${yt}`
      const tags = buildMaterialVideoTags(nodeId, displayTitle)
      const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      const entry: MaterialCustomLink = {
        id,
        url: normalized,
        title: displayTitle,
        titleRu: displayTitle,
        youtubeId: yt,
        skillNodeId: nodeId,
        tags,
        channelName: oembed?.author_name,
        addedAt: new Date().toISOString(),
      }
      setSettings({ materialCustomLinks: [...materialCustomLinks, entry] })
      setLinkUrlInput('')
      setLinkTitleInput('')
      setAddVideoPanelOpen(false)
    } finally {
      setAddSubmitting(false)
    }
  }

  const removeCustomLink = (id: string) => {
    setSettings({
      materialCustomLinks: materialCustomLinks.filter((l) => l.id !== id),
      materialFavoriteIds: materialFavoriteIds.filter((fid) => fid !== id),
    })
  }

  const renderLegacyCards = (list: MaterialCustomLink[]) => (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((link) => {
        const yt = link.youtubeId ?? parseYoutubeIdFromUrl(link.url)
        const thumb = yt ? youtubeThumbnailUrl(yt, 'mq') : null
        return (
          <li
            key={link.id}
            className="card-fantasy border border-[var(--border-primary)] overflow-hidden flex flex-col relative"
          >
            <div className="relative h-24 sm:h-28 bg-[var(--bg-deep)]">
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-[var(--text-muted)]">
                  🔗
                </div>
              )}
              <span
                className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/65 text-white font-semibold"
                aria-hidden
              >
                {t.resources.legacyLinkBadge}
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <h2 className="text-sm font-bold text-[var(--text-heading)] leading-snug line-clamp-3">
                {link.title}
              </h2>
              <div className="text-[10px] text-[var(--text-muted)] truncate" title={link.url}>
                {link.url}
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <button
                  type="button"
                  className="btn-primary text-xs py-1.5 px-2"
                  onClick={() => void openExternalUrl(link.url)}
                >
                  {t.resources.openBrowser}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs py-1.5 px-2 text-[var(--accent-hover)] border-[var(--border-secondary)]"
                  onClick={() => removeCustomLink(link.id)}
                >
                  {t.resources.removeLink}
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )

  const renderVideoCard = (r: VideoResource) => {
    const ch = RESOURCE_CHANNELS[r.channelKey]
    const isFavorite = materialFavoriteIds.includes(r.id)
    const isUserRow = r.id.startsWith('custom-')
    const isShortsQuery = isShortsQueryResource(r)
    const isClipTips = isClipTipsQueryResource(r)
    const isSketchfab = isSketchfabQueryResource(r)
    const isPinterest = isPinterestQueryResource(r)
    const isExternalQuery = isShortsQuery || isClipTips || isSketchfab || isPinterest
    const channelLabel = isShortsQuery
      ? t.resources.youtubeShortsChannelLabel!
      : isClipTips
        ? 'Clip Studio TIPS'
        : isSketchfab
          ? 'Sketchfab'
          : isPinterest
            ? 'Pinterest'
            : (r.channelLabelOverride ?? ch?.name ?? r.channelKey)
    return (
      <li
        className="resource-catalog-card card-fantasy border border-[var(--border-secondary)] overflow-hidden flex flex-col relative"
      >
            <div className="relative h-24 sm:h-28 bg-[var(--bg-deep)]">
              {!isExternalQuery && (
                <button
                  type="button"
                  className={`absolute top-2 right-2 z-10 rounded-md px-2 py-1 text-base leading-none shadow-md border ${
                    isFavorite
                      ? 'bg-[var(--gold-primary)]/25 border-[var(--gold-dark)] text-[var(--gold-light)]'
                      : 'bg-black/50 border-white/20 text-white'
                  }`}
                  aria-pressed={isFavorite}
                  title={isFavorite ? t.resources.favoriteRemove : t.resources.favoriteAdd}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    toggleFavorite(r.id)
                  }}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              )}
              <button
                type="button"
                className="text-left w-full block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hover)]"
                aria-label={`${t.common.open ?? 'Open'}: ${titleFor(r)}`}
                onClick={() => openCuratedInBrowser(r)}
              >
                {isShortsQuery ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#2a1a30] to-[#0d1220] text-[var(--gold-light)]">
                    <span className="text-2xl font-black tracking-tight" aria-hidden>
                      Shorts
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      {t.resources.shortsOpenSearchLabel}
                    </span>
                  </div>
                ) : isClipTips ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#1a3d5c] to-[#0d1220] text-sky-200 px-2 text-center">
                    <span className="text-lg font-black tracking-tight" aria-hidden>
                      CSP
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {t.resources.clipTipsOpenHint ?? 'Clip Studio TIPS'}
                    </span>
                  </div>
                ) : isSketchfab ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#1c4a3a] to-[#0d1220] text-emerald-200 px-2 text-center">
                    <span className="text-lg font-black tracking-tight" aria-hidden>
                      3D
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {t.resources.sketchfabOpenHint ?? 'Sketchfab'}
                    </span>
                  </div>
                ) : isPinterest ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#5c1a24] to-[#0d1220] text-rose-200 px-2 text-center">
                    <span className="text-lg font-black tracking-tight" aria-hidden>
                      Pin
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {t.resources.pinterestOpenHint ?? 'Pinterest'}
                    </span>
                  </div>
                ) : (
                  <img
                    src={youtubeThumbnailUrl(r.youtubeId, 'mq')}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-1">
              <button
                type="button"
                className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-hover)] rounded"
                onClick={() => openCuratedInBrowser(r)}
              >
                <h2 className="text-sm font-bold text-[var(--text-heading)] leading-snug">{titleFor(r)}</h2>
                <div className="text-[11px] text-[var(--text-muted)]">{channelLabel}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.tags.slice(0, 8).map((tg) => (
                    <span
                      key={tg}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]"
                    >
                      {tg}
                    </span>
                  ))}
                </div>
              </button>
              {!isExternalQuery && (
                <MaterialEngagementChips
                  videoId={r.id}
                  engagement={materialEngagement}
                  onSetEngagement={setMaterialEngagement}
                  labels={engagementChipLabels}
                />
              )}
              {isUserRow && (
                <button
                  type="button"
                  className="text-left text-[11px] text-[var(--accent-hover)] mt-1 pt-2 border-t border-[var(--border-secondary)] hover:underline"
                  onClick={() => removeCustomLink(r.id)}
                >
                  {t.resources.removeLink}
                </button>
              )}
            </div>
      </li>
    )
  }

  const isExternalCatalogMode =
    videoLengthMode === 'clipTips' ||
    videoLengthMode === 'sketchfab' ||
    videoLengthMode === 'pinterest'
  const catalogContentReady = isExternalCatalogMode || !catalogLoading

  const showEmpty =
    catalogContentReady && !catalogError && catalogListItems.length === 0 && legacyLinks.length === 0

  const renderLearnSlot = (
    label: string,
    resource: VideoResource | null,
    role: string,
  ) => {
    if (!resource) return null
    return (
      <div key={role} className="card-fantasy border border-[var(--border-secondary)] p-3">
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">{label}</div>
        <ul className="grid gap-3">{renderVideoCard(resource)}</ul>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] min-h-screen" data-onboarding="page-resources">
      <div className="container-fantasy pt-6 pb-[max(6rem,env(safe-area-inset-bottom,0px)+4.5rem)]">
        <SegmentedControl
          className="mb-4"
          value={catalogView}
          aria-label={t.resources.title ?? 'Materials'}
          options={[
            { value: 'learn', label: t.resources.viewLearn },
            { value: 'catalog', label: t.resources.viewCatalog },
          ]}
          onChange={setCatalogViewMode}
        />

        <div className="card-fantasy border border-[var(--border-primary)] p-4 mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 flex-1 min-w-0">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
                {t.common.category}
                <select
                  id={`${idPrefix}-cat`}
                  className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                  value={category}
                  onChange={(e) => {
                    const v = e.target.value as QuestCategory | 'all'
                    setCategory(v)
                    setNodeId(null)
                    setTag(null)
                    setPreferredTags([])
                    syncUrl({ category: v, nodeId: null, tag: null, preferredTags: [] })
                  }}
                >
                  <option value="all">{t.resources.allCategories}</option>
                  {visibleCategories.map((c) => (
                    <option key={c} value={c}>
                      {getCategoryLabel(c, lang)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
                {t.resources.skillNode}
                <select
                  id={`${idPrefix}-node`}
                  className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                  value={nodeId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value || null
                    setNodeId(v)
                    syncUrl({ category, nodeId: v, tag, preferredTags })
                  }}
                >
                  <option value="">{t.resources.allNodes}</option>
                  {nodesInCategory.map((n) => (
                    <option key={n.id} value={n.id}>
                      {getLocalizedTitle(n.title, lang)} ({getCategoryLabel(n.category, lang)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
                {t.resources.tag}
                <TagFilterCombobox
                  id={`${idPrefix}-tag`}
                  value={tag}
                  options={tagOptions}
                  allTagsLabel={t.resources.allTags}
                  placeholder={t.resources.allTags}
                  onChange={(v) => {
                    setTag(v)
                    syncUrl({ category, nodeId, tag: v, preferredTags })
                  }}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
                {t.resources.search}
                <input
                  id={`${idPrefix}-q`}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.resources.searchPlaceholder}
                  className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn-primary whitespace-nowrap w-full sm:w-auto shrink-0 px-4 py-2.5"
              onClick={() => setAddVideoPanelOpen(true)}
            >
              {t.resources.addYourLink}
            </button>
          </div>
        </div>

        {catalogView === 'learn' && (
          <div className="space-y-4 mb-6">
            <LearnModeEngagementHint
              learnModeHint={t.resources.learnModeHint ?? ''}
              engagementHint={t.resources.engagementHint}
            />
            {learnPack &&
            (learnPack.primary || learnPack.shortDemo || learnPack.reference) ? (
              <div className="grid gap-4 md:grid-cols-3">
                {renderLearnSlot(t.resources.learnPrimary!, learnPack.primary, 'primary')}
                {renderLearnSlot(t.resources.learnShort!, learnPack.shortDemo, 'short')}
                {renderLearnSlot(t.resources.learnReference!, learnPack.reference, 'ref')}
              </div>
            ) : (
              <div className="card-fantasy text-sm text-[var(--text-muted)] p-4">{t.resources.learnEmpty}</div>
            )}
            <button
              type="button"
              className="text-sm text-[var(--accent-hover)] underline"
              onClick={() => setCatalogViewMode('catalog')}
            >
              {t.resources.viewCatalog} →
            </button>
          </div>
        )}

        {addVideoPanelOpen && (
          <div className="fixed inset-0 z-[150] flex flex-col" role="dialog" aria-modal="true" aria-label={t.resources.addYourLink}>
            <button
              type="button"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px] border-0 cursor-default"
              aria-label={t.common.cancel}
              disabled={addSubmitting}
              onClick={() => {
                if (!addSubmitting) setAddVideoPanelOpen(false)
              }}
            />
            <div className="relative w-full border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl max-h-[min(85vh,520px)] overflow-y-auto">
              <div className="container-fantasy py-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-[var(--text-secondary)] pr-2">{t.resources.addVideoPanelIntro}</p>
                  <button
                    type="button"
                    className="btn-secondary text-xs shrink-0"
                    disabled={addSubmitting}
                    onClick={() => setAddVideoPanelOpen(false)}
                  >
                    {t.common.cancel}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{t.resources.myLibraryHint}</p>
                <form onSubmit={addCustomVideo} className="grid gap-3 sm:grid-cols-12 items-end">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)] sm:col-span-5">
                    {t.resources.linkUrl}
                    <input
                      type="url"
                      name={`${idPrefix}-link-url`}
                      value={linkUrlInput}
                      onChange={(e) => {
                        setLinkUrlInput(e.target.value)
                        setLinkError(null)
                      }}
                      placeholder={t.resources.linkUrlPlaceholder ?? 'https://…'}
                      className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                      autoComplete="off"
                      disabled={addSubmitting}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)] sm:col-span-5">
                    {t.resources.linkTitleOptional}
                    <input
                      type="text"
                      name={`${idPrefix}-link-title`}
                      value={linkTitleInput}
                      onChange={(e) => setLinkTitleInput(e.target.value)}
                      placeholder={t.resources.customLinkTitlePlaceholder ?? 'Label for your library'}
                      className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                      autoComplete="off"
                      disabled={addSubmitting}
                    />
                  </label>
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-transparent select-none" aria-hidden>
                      –
                    </span>
                    <button type="submit" className="btn-primary text-sm py-2 w-full disabled:opacity-60" disabled={addSubmitting}>
                      {addSubmitting ? t.resources.addingVideo : t.resources.addLink}
                    </button>
                  </div>
                </form>
                {addSubmitting && (
                  <p className="text-xs text-[var(--text-muted)]" role="status">
                    {t.resources.addingVideo}
                  </p>
                )}
                {linkError && <p className="text-xs text-[var(--accent-hover)]">{linkError}</p>}
              </div>
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="card-fantasy border border-[var(--border-secondary)] p-3 mb-4">
            <div className="text-xs font-semibold text-[var(--text-heading)] mb-1">
              {getLocalizedTitle(selectedNode.title, lang)} · {getCategoryLabel(selectedNode.category, lang)}
            </div>
            {preferredTags.length > 0 && (
              <p className="text-[11px] text-[var(--text-muted)] mb-2">
                {t.resources.contextTags}: {preferredTags.join(' · ')}
              </p>
            )}
            <div className="text-xs font-semibold text-[var(--text-heading)] mb-2">
              {t.resources.nodeYoutubeSearchTitle}
            </div>
            <div className="flex flex-wrap gap-2">
              {nodeSearchQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="btn-secondary text-xs px-2 py-1.5"
                  onClick={() => {
                    const url =
                      videoLengthMode === 'short'
                        ? youtubeShortsSearchUrl(q)
                        : videoLengthMode === 'clipTips'
                          ? clipStudioTipsSearchUrl(q)
                          : videoLengthMode === 'sketchfab'
                            ? sketchfabSearchUrl(q)
                            : videoLengthMode === 'pinterest'
                              ? pinterestSearchUrl(q)
                              : youtubeLongSearchUrl(q)
                    void openExternalUrl(url)
                  }}
                >
                  {t.resources.searchPrefix} {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {catalogView === 'catalog' && catalogContentReady && !catalogError && catalogListItems.length > 0 && (
          <section className="mb-8" aria-label={t.resources.materialSourceGroup ?? t.resources.catalogVideos}>
            {videoLengthMode === 'long' && splitCatalogTiers && !showExtendedMaterials && (
              <p className="text-xs text-[var(--text-secondary)] mb-3" role="status">
                {t.resources.catalogCoreTitle} — {coreCatalog.length} {t.resources.catalogVideoUnit}
                {extendedCatalog.length > 0 &&
                  ` · ${extendedCatalog.length} ${t.resources.catalogMoreAvailable}`}
              </p>
            )}
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <MaterialSourceModeButtons
                value={videoLengthMode}
                onChange={setMaterialVideoMode}
                ariaLabel={t.resources.materialSourceGroup ?? t.resources.catalogVideos}
                labels={{
                  long: ytLabels.long,
                  short: ytLabels.short,
                  clipTips: t.resources.videoModeClipTips ?? 'CSP Tips',
                  sketchfab: t.resources.videoModeSketchfab ?? 'Sketchfab',
                  pinterest: t.resources.videoModePinterest ?? 'Pinterest',
                }}
              />
              <p className="text-xs text-[var(--text-muted)]" role="status">
                {isFilterPending
                  ? t.resources.catalogFiltering
                  : (t.resources.catalogMatchCount ?? 'Showing {shown} of {total}')
                      .replace('{shown}', String(catalogListItems.length))
                      .replace('{total}', String(catalogMatchTotal))}
              </p>
            </div>
            {useVirtualCatalog && (
              <p className="text-xs text-[var(--text-muted)] mb-2">{t.resources.catalogVirtualScrollHint}</p>
            )}
            <VirtualizedCatalogGrid
              items={catalogListItems}
              getKey={(r) => r.id}
              renderItem={renderVideoCard}
              aria-label={t.resources.catalogVideos}
            />
            {canLoadMoreCatalog && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCatalogVisibleCount((n) => n + catalogPageStep)}
                >
                  {(t.resources.loadMoreVideos ?? 'Load {n} more').replace(
                    '{n}',
                    String(Math.min(catalogPageStep, catalogMatchTotal - catalogVisibleCount)),
                  )}
                </button>
              </div>
            )}
            {catalogExtendedLoading && (
              <p className="text-xs text-[var(--text-muted)] mt-2" role="status">
                {t.resources.catalogExtendedLoading ?? 'Loading extended library…'}
              </p>
            )}
            {videoLengthMode === 'long' &&
              splitCatalogTiers &&
              !showExtendedMaterials &&
              extendedCatalog.length > 0 &&
              !useVirtualCatalog && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={catalogExtendedLoading}
                  onClick={() => setShowExtendedMaterials(true)}
                >
                  {catalogExtendedLoading
                    ? (t.resources.catalogExtendedLoading ?? 'Loading extended library…')
                    : (t.resources.showMoreMaterials ?? 'Show {n} more videos').replace(
                        '{n}',
                        String(extendedCatalog.length),
                      )}
                </button>
              </div>
            )}
          </section>
        )}

        {catalogView === 'catalog' && legacyLinks.length > 0 && (
          <section className="mb-8" aria-labelledby={`${idPrefix}-legacy`}>
            <h2 id={`${idPrefix}-legacy`} className="text-lg font-bold text-[var(--text-heading)] mb-3">
              {t.resources.legacyImportedLinks}
            </h2>
            {renderLegacyCards(legacyLinks)}
          </section>
        )}

        {catalogLoading && !isExternalCatalogMode && (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="text-4xl mb-3 animate-pulse" aria-hidden>
              📚
            </div>
            <p className="text-[var(--text-secondary)]">{t.resources.catalogLoading}</p>
          </div>
        )}

        {catalogError && (
          <div className="banner-error p-4 rounded-xl mb-6" role="alert">
            {t.resources.catalogLoadError}
          </div>
        )}

        {catalogView === 'catalog' && showEmpty && (
          <div className="text-center py-16 text-[var(--text-muted)]">{t.resources.noResults}</div>
        )}

        <section className="mt-12 pt-8 border-t border-[var(--border-secondary)]">
          <h2 className="text-lg font-bold text-[var(--text-heading)] mb-2">{t.resources.partnerChannels}</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">{t.resources.partnerChannelsHint}</p>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_CHANNEL_LIST.map(({ key, name, url }) => (
              <button
                key={key}
                type="button"
                className="px-2 py-1 rounded-md text-[11px] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                onClick={() => void openExternalUrl(url)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-[var(--text-muted)] mt-8">
          {t.resources.libraryStats.replace('{n}', String(catalog?.length ?? 0))}
        </p>
      </div>
    </div>
  )
}
