import { useState, useEffect, useMemo, useRef, useId, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import QuestCatalogRow from '@/components/QuestCatalogRow'
import AddQuestModal from '@/components/AddQuestModal'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useI18n, getCategoryLabel } from '@/i18n'
import { QuestService } from '@/utils/questService'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import type { QuestCategory } from '@/data/skillTree'
import type { Quest } from '@/store/models'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { getSatisfiedQuestIds } from '@/utils/questPrerequisites'
import { buildRecommendedQuestPool } from '@/utils/recommendedQuestPool'
import { shouldGateDailiesForBeginner } from '@/utils/fundamentalsProgress'
import { Link } from 'react-router'

const PAGE_SIZE = 20
const DIFFICULTY_ORDER: Record<string, number> = { novice: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 }

const QUEST_DIFFICULTY_KEYS: Quest['difficulty'][] = ['novice', 'intermediate', 'advanced', 'master', 'expert']

function readCategoryFromSearchParams(
  searchParams: URLSearchParams,
  allowed: readonly QuestCategory[],
): QuestCategory | 'all' {
  const raw = searchParams.get('category')
  if (!raw || raw === 'all') return 'all'
  return allowed.includes(raw as QuestCategory) ? (raw as QuestCategory) : 'all'
}

function readDifficultyFromSearchParams(searchParams: URLSearchParams): Quest['difficulty'] | 'all' {
  const raw = searchParams.get('difficulty')
  if (!raw || raw === 'all') return 'all'
  return QUEST_DIFFICULTY_KEYS.includes(raw as Quest['difficulty']) ? (raw as Quest['difficulty']) : 'all'
}

const Quests = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const idPrefix = useId()
  const { t, language } = useI18n()
  const lang = language
  const {
    completedQuests,
    questCompletionLogs,
    quests,
    questTitleOverrides,
    questsLoadError,
    dailyQuestsIds,
    completedToday,
    fundamentalsProgress,
  } = useQuestStore(
    useShallow((s) => ({
      completedQuests: s.completedQuests,
      questCompletionLogs: s.questCompletionLogs,
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
      questsLoadError: s.questsLoadError,
      dailyQuestsIds: s.dailyQuestsIds,
      completedToday: s.completedToday,
      fundamentalsProgress: s.fundamentalsProgress,
    })),
  )
  const satisfiedOnceIds = useMemo(
    () => getSatisfiedQuestIds(questCompletionLogs),
    [questCompletionLogs],
  )
  const visibleCategories = useVisibleCategories()
  const [categoryFilter, setCategoryFilter] = useState<QuestCategory | 'all'>(() =>
    readCategoryFromSearchParams(searchParams, visibleCategories),
  )
  const [difficultyFilter, setDifficultyFilter] = useState<Quest['difficulty'] | 'all'>(() =>
    readDifficultyFromSearchParams(searchParams),
  )
  const [page, setPage] = useState(1)
  const [addQuestOpen, setAddQuestOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>(() => 'recommended')
  const skillNodes = useSkillStore((s) => s.skillNodes)
  const experienceTier = useUIStore((s) => s.settings.experienceTier ?? 'beginner')
  const gateDailies = shouldGateDailiesForBeginner(experienceTier, fundamentalsProgress)

  const goToQuest = useCallback((id: number) => navigate(`/quests/${id}`), [navigate])

  const activeSessionQuestId = useQuestSessionStore((s) => s.session?.questId)
  const activeSessionExpired = useQuestSessionStore((s) => s.session?.isExpired ?? false)

  useEffect(() => {
    if (activeSessionQuestId == null || activeSessionExpired) return
    navigate(`/quests/${activeSessionQuestId}`, { replace: true })
  }, [activeSessionQuestId, activeSessionExpired, navigate])

  useEffect(() => {
    setCategoryFilter(readCategoryFromSearchParams(searchParams, visibleCategories))
    setDifficultyFilter(readDifficultyFromSearchParams(searchParams))
  }, [searchParams, visibleCategories])

  const syncCatalogUrl = useCallback((next: { category: QuestCategory | 'all'; difficulty: Quest['difficulty'] | 'all' }) => {
    const tags = searchParams.get('tags')
    const p = new URLSearchParams()
    if (tags) p.set('tags', tags)
    if (next.category !== 'all') p.set('category', next.category)
    if (next.difficulty !== 'all') p.set('difficulty', next.difficulty)
    setSearchParams(p, { replace: true, preventScrollReset: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (categoryFilter !== 'all' && !visibleCategories.includes(categoryFilter)) {
      setCategoryFilter('all')
      syncCatalogUrl({ category: 'all', difficulty: difficultyFilter })
    }
  }, [categoryFilter, visibleCategories, difficultyFilter, syncCatalogUrl])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, difficultyFilter])

  const tagsFilter = searchParams.get('tags')?.split(',').filter(Boolean) || undefined

  const difficultySelectLabels = useMemo(
    (): Record<Quest['difficulty'], string> => ({
      novice: t.difficulty.novice,
      intermediate: t.difficulty.intermediate,
      advanced: t.difficulty.advanced,
      master: t.difficulty.master,
      expert: t.difficulty.expert,
    }),
    [
      t.difficulty.advanced,
      t.difficulty.expert,
      t.difficulty.intermediate,
      t.difficulty.master,
      t.difficulty.novice,
    ],
  )

  const { items: filteredQuests, totalPages } = useMemo(
    () =>
      QuestService.getFiltered({
        quests,
        questTitleOverrides,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
        tags: tagsFilter,
        allowedCategories: visibleCategories,
        page: viewMode === 'recommended' ? 1 : page,
        pageSize: viewMode === 'recommended' ? 500 : PAGE_SIZE,
      }),
    [quests, questTitleOverrides, categoryFilter, difficultyFilter, page, tagsFilter, visibleCategories, viewMode],
  )

  const recommendedPool = useMemo(() => {
    if (viewMode !== 'recommended') return filteredQuests
    return buildRecommendedQuestPool({
      filteredQuests,
      quests,
      completedQuests,
      satisfiedOnceIds,
      dailyQuestsIds,
      completedToday,
      skillNodes,
      experienceTier,
      fundamentalsProgress,
      visibleCategories,
      questCompletionLogs,
    })
  }, [
    viewMode,
    filteredQuests,
    skillNodes,
    experienceTier,
    dailyQuestsIds,
    quests,
    completedQuests,
    satisfiedOnceIds,
    completedToday,
    questCompletionLogs,
    visibleCategories,
    fundamentalsProgress,
  ])

  const sortedQuests = useMemo(() =>
    [...(viewMode === 'recommended' ? recommendedPool : filteredQuests)].sort((a, b) => {
      const diffCompare = (DIFFICULTY_ORDER[a.difficulty] || 10) - (DIFFICULTY_ORDER[b.difficulty] || 10)
      if (diffCompare !== 0) return diffCompare
      return a.min_level - b.min_level
    }),
    [filteredQuests, recommendedPool, viewMode]
  )

  const displayTotalPages = viewMode === 'recommended' ? 1 : totalPages

  const questListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = questListRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const ae = document.activeElement as HTMLElement | null
      if (!ae || !el.contains(ae)) return
      if (ae.closest('input, textarea, select, [contenteditable="true"]')) return
      const row = ae.closest('[data-quest-row]') as HTMLElement | null
      if (!row || !el.contains(row)) return
      const idx = Number(row.dataset.questIndex)
      if (Number.isNaN(idx)) return
      const delta = e.key === 'ArrowDown' ? 1 : -1
      const next = el.querySelector(`[data-quest-row][data-quest-index="${idx + delta}"]`) as HTMLElement | null
      const btn = next?.querySelector('button') as HTMLButtonElement | undefined
      if (btn) {
        e.preventDefault()
        btn.focus()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [sortedQuests.length])

  return (
    <div className="container-fantasy" data-onboarding="page-quests">
      {gateDailies && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)]">
          <p>{t.fundamentals?.catalogBanner}</p>
          <Link to="/fundamentals" className="text-[var(--accent-hover)] font-medium mt-2 inline-block">
            {t.fundamentals?.continueCta ?? 'Continue fundamentals'}
          </Link>
        </div>
      )}

      {questsLoadError && (
        <div className="mb-6 p-4 rounded-xl banner-error text-center flex flex-col items-center gap-3">
          <span>{t.common.questsLoadError || 'Failed to load quests data'}</span>
          <button type="button" className="btn-secondary text-sm px-4 py-2" onClick={() => void useQuestStore.getState().loadQuests()}>
            {t.common.retry ?? 'Retry'}
          </button>
        </div>
      )}

      <div className="mb-4">
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          aria-label={t.quests.title}
          options={[
            { value: 'recommended', label: t.quests.viewRecommended ?? 'Recommended' },
            { value: 'all', label: t.quests.viewAll ?? 'Browse all' },
          ]}
        />
      </div>

      <div className="mb-8">
        <h2 id={`${idPrefix}-catalog`} className="sr-only">{t.quests.title}</h2>
        <div className="card-fantasy border border-[var(--border-primary)] p-4" aria-labelledby={`${idPrefix}-catalog`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-heading)]">
              {t.common.category ?? 'Category'}
              <select
                id={`${idPrefix}-quest-cat`}
                className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                value={categoryFilter}
                onChange={(e) => {
                  const v = e.target.value as QuestCategory | 'all'
                  setCategoryFilter(v)
                  syncCatalogUrl({ category: v, difficulty: difficultyFilter })
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
              {t.common.difficulty}
              <select
                id={`${idPrefix}-quest-diff`}
                className="rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                value={difficultyFilter}
                onChange={(e) => {
                  const v = e.target.value as Quest['difficulty'] | 'all'
                  setDifficultyFilter(v)
                  syncCatalogUrl({ category: categoryFilter, difficulty: v })
                }}
              >
                <option value="all">{t.difficulty.all}</option>
                {QUEST_DIFFICULTY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {difficultySelectLabels[key]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={() => setAddQuestOpen(true)}
                className="btn-primary w-full py-2 text-sm"
              >
                ＋ {t.quests.addQuest}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddQuestModal
        open={addQuestOpen}
        onClose={() => setAddQuestOpen(false)}
        onCreated={(quest) => goToQuest(quest.id)}
      />

      <div
        key={viewMode}
        ref={questListRef}
        className="motion-stagger-group space-y-4"
      >
        {sortedQuests.length > 0 ? (
          sortedQuests.map((quest, index) => (
            <QuestCatalogRow
              key={quest.id}
              quest={quest}
              index={index}
              language={lang}
              completedQuests={completedQuests}
              satisfiedOnceIds={satisfiedOnceIds}
              allQuests={quests}
              questTitleOverrides={questTitleOverrides}
              onDetails={goToQuest}
            />
          ))
        ) : (
          <div className="card-fantasy text-center py-12">
            <p className="text-fantasy text-lg">{t.common.noQuestsFound}</p>
            <p className="text-fantasy text-sm mt-3 text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
              {t.common.noQuestsHint}
            </p>
          </div>
        )}
      </div>

      {displayTotalPages > 1 && viewMode === 'all' && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary text-sm px-3 py-1 disabled:opacity-40"
            aria-label={t.common.previousPage}
          >
            ←
          </button>
          <span className="flex items-center text-sm text-[var(--text-secondary)] px-3">
            {page} / {displayTotalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(displayTotalPages, p + 1))}
            disabled={page >= displayTotalPages}
            className="btn-secondary text-sm px-3 py-1 disabled:opacity-40"
            aria-label={t.common.nextPage}
          >
            →
          </button>
        </div>
      )}

    </div>
  )
}

export default Quests