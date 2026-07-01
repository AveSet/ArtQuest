import { useQuestStore } from '@/store/useQuestStore'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { resolveQuestById } from '@/utils/resolveQuestById'
import VirtualizedGroupedGallery from '@/components/gallery/VirtualizedGroupedGallery'
import VirtualizedCatalogGrid from '@/components/resources/VirtualizedCatalogGrid'
import EmptyState from '@/components/ui/EmptyState'
import { GalleryMedia } from '@/components/GalleryMedia'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { refreshGallerySyncFromDisk } from '@/utils/refreshGallerySync'
import { GalleryLightbox } from '@/components/GalleryLightbox'
import type { QuestCategory } from '@/data/skillTree'
import { CATEGORY_INFO } from '@/data/skillTree'
import { getCategoryLabel } from '@/i18n'
import { formatLocalizedDate } from '@/utils/dateLocale'
import { getMistakeTagLabel } from '@/utils/mistakeTags'
import GalleryWorkReview from '@/components/GalleryWorkReview'
import { pickRecommendedQuest, getRecommendedQuestReasonText } from '@/utils/recommendedQuest'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { useLearningFocusTags } from '@/utils/useLearningFocusTags'
import { useDailyQuests } from '@/utils/useDailyQuests'
import { generateShareCardPng, downloadShareCard, type ShareCardFormat } from '@/utils/shareCard'
import { computePlayerLevel, getPlayerRankKey } from '@/utils/playerLevel'
import { useGalleryWorkContextMenu } from '@/components/GalleryWorkContextMenu'
import { isElectronDesktop, subscribeGallerySyncUpdated } from '@/utils/electronBridge'
import { playUiClick } from '@/utils/sound'

type ViewMode = 'grouped' | 'grid' | 'compact'
type SortOrder = 'newest' | 'oldest'
type SortScope = 'all' | 'day'

type FlatWork = {
  id?: string
  questId: number
  questTitle: string
  category: QuestCategory
  imageUrl: string
  savedPath?: string
  mediaType?: 'image' | 'video'
  date: string
  notes?: string
  improvementNotes?: string
  syncStatus?: string
  syncError?: string
  storageMode?: 'local' | 'local_and_cloud' | 'cloud_only' | 'google_drive'
  tags?: string[]
  favorite?: boolean
  workIndex: number
}

const Gallery = () => {
  const navigate = useNavigate()
  const {
    completedWorks,
    toggleWorkFavorite,
    quests,
    questTitleOverrides,
    questCompletionLogs,
    completedQuests,
    completedToday,
  } = useQuestStore(
    useShallow((s) => ({
      completedWorks: s.completedWorks,
      toggleWorkFavorite: s.toggleWorkFavorite,
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
      questCompletionLogs: s.questCompletionLogs,
      completedQuests: s.completedQuests,
      completedToday: s.completedToday,
    })),
  )
  const { t, language } = useI18n()
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [sortScope, setSortScope] = useState<SortScope>('all')
  const [lightboxWork, setLightboxWork] = useState<FlatWork | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | QuestCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const { skillNodes } = useSkillStore(useShallow((s) => ({ skillNodes: s.skillNodes })))
  const dailyQuests = useDailyQuests()
  const { adaptiveWeights, streakState } = useUIStore(
    useShallow((s) => ({ adaptiveWeights: s.adaptiveWeights, streakState: s.streakState })),
  )
  const focusTags = useLearningFocusTags()
  const { openContextMenu, menuPortal, openFileLocation } = useGalleryWorkContextMenu()

  useEffect(() => {
    void refreshGallerySyncFromDisk()
    const unsubscribe = subscribeGallerySyncUpdated(() => {
      void refreshGallerySyncFromDisk()
    })
    return () => unsubscribe?.()
  }, [])

  const groupedWorks = useMemo(() => {
    const groups: Record<
      number,
      {
        id?: string
        questId: number
        imageUrl: string
        savedPath?: string
        mediaType?: 'image' | 'video'
        date: string
        notes?: string
        tags?: string[]
        favorite?: boolean
        syncStatus?: string
        syncError?: string
        storageMode?: 'local' | 'local_and_cloud' | 'cloud_only' | 'google_drive'
        workIndex: number
      }[]
    > = {}

    for (const work of completedWorks) {
      const entry = {
        id: work.id,
        questId: work.questId,
        imageUrl: work.imageUrl,
        savedPath: work.savedPath,
        mediaType: work.mediaType,
        date: work.date,
        notes: work.notes,
        improvementNotes: work.improvementNotes,
        tags: work.tags ?? [],
        favorite: work.favorite ?? false,
        syncStatus: work.syncStatus,
        syncError: work.syncError,
        remoteFileId: work.remoteFileId,
        storageMode: work.storageMode,
        workIndex: 0,
        questTitle: '',
        category: 'drawing' as QuestCategory,
      }
      if (!groups[work.questId]) groups[work.questId] = []
      groups[work.questId]!.push(entry)
    }

    return Object.entries(groups).map(([questId, works]) => {
      const quest = resolveQuestById(parseInt(questId, 10), quests)
      const questTitle = quest
        ? resolveQuestTitle(quest, language, questTitleOverrides)
        : t.gallery.unknownQuest
      return {
        questId: parseInt(questId, 10),
        works: works.map((w, i) => ({ ...w, workIndex: i })),
        questTitle,
        category: (quest?.category ?? 'drawing') as QuestCategory,
      }
    })
  }, [completedWorks, quests, language, questTitleOverrides, t.gallery.unknownQuest])

  const categoryFilteredGroupedWorks = useMemo(() => {
    if (categoryFilter === 'all') return groupedWorks
    return groupedWorks.filter((g) => g.category === categoryFilter)
  }, [groupedWorks, categoryFilter])

  const searchFilteredGroupedWorks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query && !favoriteOnly) return categoryFilteredGroupedWorks
    return categoryFilteredGroupedWorks
      .map((group) => {
        const titleMatch = group.questTitle.toLowerCase().includes(query)
        const categoryMatch = getCategoryLabel(group.category, language).toLowerCase().includes(query)
        const works = group.works.filter((work) => {
          if (favoriteOnly && !work.favorite) return false
          if (!query) return true
          const tagMatch = (work.tags ?? []).some((tag) =>
            `${tag} ${getMistakeTagLabel(tag, language)}`.toLowerCase().includes(query),
          )
          const notesMatch = work.notes?.toLowerCase().includes(query) ?? false
          const dateMatch = work.date.slice(0, 10).includes(query)
          return titleMatch || categoryMatch || tagMatch || notesMatch || dateMatch
        })
        return { ...group, works }
      })
      .filter((group) => group.works.length > 0)
  }, [categoryFilteredGroupedWorks, favoriteOnly, language, searchQuery])

  const flatWorks = useMemo((): FlatWork[] => {
    const today = getLocalDateStr()
    const rows: FlatWork[] = []
    for (const group of searchFilteredGroupedWorks) {
      for (const work of group.works) {
        rows.push({
          ...work,
          questTitle: group.questTitle,
          category: group.category,
        })
      }
    }
    const scoped =
      sortScope === 'day' ? rows.filter((w) => w.date.slice(0, 10) === today) : rows
    return scoped.sort((a, b) => {
      const ta = new Date(a.date).getTime()
      const tb = new Date(b.date).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })
  }, [searchFilteredGroupedWorks, sortOrder, sortScope])

  const lightboxIndex = lightboxWork
    ? flatWorks.findIndex(
        (w) => w.questId === lightboxWork.questId && w.date === lightboxWork.date,
      )
    : -1
  const lightboxRecommendation = useMemo(() => {
    if (!lightboxWork) return null
    return pickRecommendedQuest({
      quests,
      completedQuests,
      dailyQuests,
      completedToday,
      skillNodes,
      questCompletionLogs,
      completedWorks,
      focusTags,
      adaptiveWeights,
    })
  }, [
    adaptiveWeights,
    completedQuests,
    completedToday,
    completedWorks,
    dailyQuests,
    focusTags,
    lightboxWork,
    questCompletionLogs,
    quests,
    skillNodes,
  ])

  const handleShareWork = useCallback(
    async (format: ShareCardFormat) => {
      if (!lightboxWork) return
      playUiClick()
      const playerLevel = computePlayerLevel(skillNodes)
      const rankKey = getPlayerRankKey(playerLevel)
      const rankTitles: Record<string, string> = {
        master: t.character.master,
        journeyman: t.character.journeyman,
        apprentice: t.character.apprentice,
        novice: t.character.novice,
        legend: t.character.legend,
      }
      const rankColors: Record<string, string> = {
        master: 'var(--rank-master)',
        journeyman: 'var(--rank-journeyman)',
        apprentice: 'var(--rank-apprentice)',
        novice: 'var(--rank-novice)',
        legend: 'var(--rank-legend)',
      }
      const completionLog = questCompletionLogs.find(
        (log) => log.questId === lightboxWork.questId && log.completedAt === lightboxWork.date,
      )
      const blob = await generateShareCardPng({
        questTitle: lightboxWork.questTitle,
        streak: streakState.current,
        rankLabel: rankTitles[rankKey] ?? t.character.novice,
        language,
        playerLevel,
        rankColor: rankColors[rankKey],
        format,
        workImageUrl: lightboxWork.imageUrl,
        xpEarned: completionLog?.xpEarned,
        categoryLabel: getCategoryLabel(lightboxWork.category, language),
      })
      if (!blob) return
      const suffix = format === 'story' ? 'story' : 'wide'
      await downloadShareCard(blob, `artquest-gallery-${lightboxWork.questId}-${suffix}.png`)
    },
    [language, lightboxWork, questCompletionLogs, skillNodes, streakState.current, t.character],
  )

  const filteredGroupedWorks = useMemo(() => {
    const today = getLocalDateStr()
    const scoped = searchFilteredGroupedWorks
      .map((group) => {
        let works = [...group.works]
        if (sortScope === 'day') {
          works = works.filter((w) => w.date.slice(0, 10) === today)
        }
        works.sort((a, b) => {
          const ta = new Date(a.date).getTime()
          const tb = new Date(b.date).getTime()
          return sortOrder === 'newest' ? tb - ta : ta - tb
        })
        return { ...group, works }
      })
      .filter((g) => g.works.length > 0)

    scoped.sort((a, b) => {
      const latest = (g: (typeof scoped)[number]) =>
        g.works.reduce((max, w) => Math.max(max, new Date(w.date).getTime()), 0)
      const la = latest(a)
      const lb = latest(b)
      return sortOrder === 'newest' ? lb - la : la - lb
    })
    return scoped
  }, [searchFilteredGroupedWorks, sortOrder, sortScope])

  const monthGroups = useMemo(() => {
    const groups: Record<string, { monthKey: string; label: string; groups: typeof filteredGroupedWorks }> = {}

    for (const group of filteredGroupedWorks) {
      const worksByMonth = new Map<string, typeof group.works>()
      for (const work of group.works) {
        const d = new Date(work.date)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const bucket = worksByMonth.get(monthKey)
        if (bucket) bucket.push(work)
        else worksByMonth.set(monthKey, [work])
      }

      for (const [monthKey, works] of worksByMonth) {
        const anchor = works[0]?.date
        if (!anchor) continue
        const monthLabel = formatLocalizedDate(anchor, language, {
          month: 'long',
          year: 'numeric',
        })
        if (!groups[monthKey]) {
          groups[monthKey] = { monthKey, label: monthLabel, groups: [] }
        }
        groups[monthKey].groups.push({ ...group, works })
      }
    }

    for (const bucket of Object.values(groups)) {
      bucket.groups.sort((a, b) => {
        const latest = (g: (typeof bucket.groups)[number]) =>
          g.works.reduce((max, w) => Math.max(max, new Date(w.date).getTime()), 0)
        const la = latest(a)
        const lb = latest(b)
        return sortOrder === 'newest' ? lb - la : la - lb
      })
    }

    return Object.entries(groups)
      .sort(([a], [b]) => (sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b)))
      .map(([, data]) => data)
  }, [filteredGroupedWorks, language, sortOrder])

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  const formatDate = (dateStr: string) =>
    formatLocalizedDate(dateStr, language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const toggleFavorite = (work: FlatWork) => {
    toggleWorkFavorite({ id: work.id, questId: work.questId, date: work.date })
    setLightboxWork((current) =>
      current && current.questId === work.questId && current.date === work.date
        ? { ...current, favorite: !current.favorite }
        : current,
    )
  }

  const visibleCount = flatWorks.length
  const toolbar = (
    <div className="gallery-toolbar card-fantasy px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['grouped', 'grid', 'compact'] as ViewMode[]).map((mode) => {
          const active = viewMode === mode
          return (
            <button
              key={mode}
              type="button"
              className={`btn-primary text-xs py-1.5 px-3 ${active ? '' : 'opacity-70 hover:opacity-100'}`}
              aria-pressed={active}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'grouped'
                ? t.gallery.viewGrouped
                : mode === 'grid'
                  ? t.gallery.viewGrid
                  : t.gallery.viewCompact}
            </button>
          )
        })}

        <div className="hidden sm:block w-px h-6 bg-[var(--border-secondary)] mx-1" aria-hidden />

        <input
          type="search"
          className="text-xs rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-3 py-1.5 min-w-[10rem] flex-1 sm:flex-none sm:min-w-[12rem]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.gallery.searchPlaceholder ?? 'Search works, tags, notes'}
          aria-label={t.gallery.searchAria ?? 'Search gallery'}
        />
        <button
          type="button"
          className={`text-xs rounded-lg border px-3 py-1.5 ${favoriteOnly ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-hover)]' : 'border-[var(--border-secondary)] text-[var(--text-secondary)]'}`}
          aria-pressed={favoriteOnly}
          onClick={() => setFavoriteOnly((v) => !v)}
        >
          {t.gallery.favoritesOnly ?? 'Favorites'}
        </button>
        <select
          className="text-xs rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-2 py-1.5"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'all' | QuestCategory)}
          aria-label={t.gallery.filterAllCategories}
        >
          <option value="all">{t.gallery.filterAllCategories}</option>
          {(Object.keys(CATEGORY_INFO) as QuestCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat, language)}
            </option>
          ))}
        </select>
        <select
          className="text-xs rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-2 py-1.5"
          value={sortScope}
          onChange={(e) => setSortScope(e.target.value as SortScope)}
          aria-label={t.gallery.scopeAllTime}
        >
          <option value="all">{t.gallery.scopeAllTime}</option>
          <option value="day">{t.gallery.scopeToday}</option>
        </select>
        <select
          className="text-xs rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-2 py-1.5"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          aria-label={t.gallery.sortNewest}
        >
          <option value="newest">{t.gallery.sortNewest}</option>
          <option value="oldest">{t.gallery.sortOldest}</option>
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto" aria-live="polite">
          {visibleCount}
        </span>
      </div>
    </div>
  )

  if (groupedWorks.length === 0) {
    return (
      <div className="container-fantasy" data-onboarding="page-gallery">
        <EmptyState icon="🎨" title={t.gallery.empty} description={t.gallery.emptyHint}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" className="btn-primary px-6 py-3" onClick={() => navigate('/quests')}>
              {t.gallery.allQuestsBtn}
            </button>
            <button type="button" className="btn-secondary px-6 py-3" onClick={() => navigate('/')}>
              {t.gallery.dailyQuestsBtn}
            </button>
          </div>
        </EmptyState>
      </div>
    )
  }

  if (filteredGroupedWorks.length === 0) {
    return (
      <div className="container-fantasy" data-onboarding="page-gallery">
        {toolbar}
        <EmptyState className="mt-4" title={t.gallery.filterEmpty ?? t.gallery.empty}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setCategoryFilter('all')
              setSearchQuery('')
              setFavoriteOnly(false)
            }}
          >
            {t.gallery.filterAllCategories}
          </button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container-fantasy" data-onboarding="page-gallery">
      {toolbar}

      {viewMode === 'grouped' && (
        <VirtualizedGroupedGallery
          className="mt-4"
          monthGroups={monthGroups}
          collapsedMonths={collapsedMonths}
          onToggleMonth={toggleMonth}
          language={language}
        />
      )}

      {viewMode === 'grid' && (
        <VirtualizedCatalogGrid
          className="gallery-grid mt-4"
          items={flatWorks}
          getKey={(work) => `${work.questId}-${work.workIndex}`}
          rowHeight={148}
          minColumnWidth={140}
          virtualizeThreshold={48}
          aria-label={t.gallery.viewGrid}
          renderItem={(work) => (
            <div className="gallery-grid-tile relative group/gtile">
              <button
                type="button"
                className="gallery-grid-tile__open w-full"
                onClick={() => setLightboxWork(work)}
              >
                <GalleryMedia
                  imageUrl={work.imageUrl}
                  savedPath={work.savedPath}
                  mediaType={work.mediaType}
                  alt={work.questTitle}
                  className="gallery-thumb"
                  onContextMenu={(e) => openContextMenu(e, work.savedPath)}
                />
                <span className="text-[10px] text-[var(--text-muted)] truncate w-full">{work.questTitle}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {work.favorite ? '★ ' : ''}{formatDate(work.date)}
                </span>
              </button>
              <button
                type="button"
                className={`absolute top-1.5 right-1.5 z-10 rounded-full px-1.5 py-0.5 text-xs leading-none ${
                  work.favorite
                    ? 'text-[var(--gold-primary)]'
                    : 'text-[var(--text-muted)] opacity-0 group-hover/gtile:opacity-100'
                }`}
                aria-label={work.favorite ? (t.gallery.favoriteOn ?? 'Favorite') : (t.gallery.favoriteOff ?? 'Add favorite')}
                aria-pressed={!!work.favorite}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(work)
                }}
              >
                {work.favorite ? '★' : '☆'}
              </button>
            </div>
          )}
        />
      )}

      {viewMode === 'compact' && (
        <VirtualizedCatalogGrid
          className="gallery-compact-list mt-4"
          items={flatWorks}
          getKey={(work) => `${work.questId}-${work.workIndex}`}
          rowHeight={96}
          minColumnWidth={900}
          virtualizeThreshold={32}
          aria-label={t.gallery.viewCompact ?? t.gallery.viewGrid}
          renderItem={(work) => (
            <div className="gallery-compact-row relative group/crow">
            <button
              type="button"
              className="gallery-compact-row__open flex flex-1 min-w-0 items-center gap-3 text-left"
              onClick={() => setLightboxWork(work)}
            >
              <GalleryMedia
                imageUrl={work.imageUrl}
                savedPath={work.savedPath}
                mediaType={work.mediaType}
                alt={work.questTitle}
                className=""
                onContextMenu={(e) => openContextMenu(e, work.savedPath)}
              />
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold text-[var(--text-heading)] truncate">{work.questTitle}</div>
                <div className="text-xs text-[var(--text-muted)]">{formatDate(work.date)}</div>
                {work.notes && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{work.notes}</p>
                )}
                {work.tags && work.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {work.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[var(--text-secondary)]">
                        {getMistakeTagLabel(tag, language)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
              <button
                type="button"
                className={`shrink-0 rounded-full px-2 py-1 text-sm ${
                  work.favorite ? 'text-[var(--gold-primary)]' : 'text-[var(--text-muted)] opacity-70 hover:opacity-100'
                }`}
                aria-label={work.favorite ? (t.gallery.favoriteOn ?? 'Favorite') : (t.gallery.favoriteOff ?? 'Add favorite')}
                aria-pressed={!!work.favorite}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(work)
                }}
              >
                {work.favorite ? '★' : '☆'}
              </button>
            </div>
          )}
        />
      )}

      {lightboxWork && (
        <GalleryLightbox
          open
          ariaLabel={lightboxWork.questTitle}
          onClose={() => setLightboxWork(null)}
          total={flatWorks.length}
          closeLabel={t.common.close}
          prevLabel={t.gallery.lightboxPrev}
          nextLabel={t.gallery.lightboxNext}
          mediaKey={lightboxIndex >= 0 ? lightboxIndex : lightboxWork.questId}
          counterLabel={
            flatWorks.length > 1 && lightboxIndex >= 0
              ? `${lightboxIndex + 1} / ${flatWorks.length}`
              : undefined
          }
          onPrev={
            flatWorks.length > 1
              ? () => {
                  if (lightboxIndex > 0) setLightboxWork(flatWorks[lightboxIndex - 1]!)
                }
              : undefined
          }
          onNext={
            flatWorks.length > 1
              ? () => {
                  if (lightboxIndex >= 0 && lightboxIndex < flatWorks.length - 1) {
                    setLightboxWork(flatWorks[lightboxIndex + 1]!)
                  }
                }
              : undefined
          }
          media={
            <GalleryMedia
              imageUrl={lightboxWork.imageUrl}
              savedPath={lightboxWork.savedPath}
              mediaType={lightboxWork.mediaType}
              alt={lightboxWork.questTitle}
              className=""
              onContextMenu={(e) => openContextMenu(e, lightboxWork.savedPath)}
            />
          }
        >
          <div className="font-semibold">{lightboxWork.questTitle}</div>
          <div className="text-sm opacity-80">{formatDate(lightboxWork.date)}</div>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] opacity-85">
            <span className="rounded-full border border-white/20 px-2 py-0.5">
              {getCategoryLabel(lightboxWork.category, language)}
            </span>
            {lightboxWork.improvementNotes ? (
              <span className="rounded-full border border-white/20 px-2 py-0.5">
                {t.gallery.practiceNext ?? 'Next practice'}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="mt-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold disabled:opacity-40"
            disabled={!lightboxWork.savedPath || !isElectronDesktop()}
            title={!lightboxWork.savedPath ? (t.gallery.showInFolderDisabled ?? 'File not saved locally') : undefined}
            onClick={() => void openFileLocation(lightboxWork.savedPath)}
          >
            {t.gallery.showInFolder}
          </button>
          <button
            type="button"
            className="mt-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold"
            onClick={() => toggleFavorite(lightboxWork)}
          >
            {lightboxWork.favorite
              ? (t.gallery.favoriteOn ?? '★ Favorite')
              : (t.gallery.favoriteOff ?? '☆ Add favorite')}
          </button>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold"
              onClick={() => void handleShareWork('landscape')}
            >
              {t.dashboard.shareProgress ?? 'Share progress'}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold"
              onClick={() => void handleShareWork('story')}
            >
              {t.gallery.shareStory ?? 'Share story'}
            </button>
          </div>
          {lightboxWork.tags && lightboxWork.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {lightboxWork.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {getMistakeTagLabel(tag, language)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 max-w-lg mx-auto text-left">
            <GalleryWorkReview
              variant="lightbox"
              compact
              workKey={{ id: lightboxWork.id, questId: lightboxWork.questId, date: lightboxWork.date }}
              notes={lightboxWork.notes}
              improvementNotes={lightboxWork.improvementNotes}
              tags={lightboxWork.tags}
            />
          </div>
          {lightboxRecommendation ? (
            <div className="mt-3 text-center max-w-md mx-auto">
              <p className="text-xs opacity-80 mb-2">
                {getRecommendedQuestReasonText(lightboxRecommendation.reason, t.dashboard)}
              </p>
              <button
                type="button"
                className="btn-primary text-xs py-2 px-4"
                onClick={() => {
                  setLightboxWork(null)
                  navigate(`/quests/${lightboxRecommendation.quest.id}`)
                }}
              >
                {t.gallery.practiceNext}: {resolveQuestTitle(lightboxRecommendation.quest, language, questTitleOverrides)} →
              </button>
            </div>
          ) : null}
        </GalleryLightbox>
      )}
      {menuPortal}
    </div>
  )
}

export default Gallery
