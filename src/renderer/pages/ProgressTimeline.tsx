import { useMemo, useRef, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNavigate } from 'react-router'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n, getCategoryLabel as _getCategoryLabel } from '@/i18n'
import { formatLocalizedDate } from '@/utils/dateLocale'
import type { Language } from '@/i18n/languages'
import {
  buildTimelineMonthGroups,
  type TimelineEntryDerived,
} from '@/utils/questLogDerivedStats'
import { getQuestLogDerivedStats } from '@/utils/questLogDerivedStatsCache'
import {
  buildPracticeStreakGraceDays,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateAveragePerWeek,
} from '@/utils/streakCalculations'
import { useUIStore } from '@/store/useUIStore'
import { usePortraitStore } from '@/store/usePortraitStore'

type ViewMode = 'timeline' | 'calendar'

type TimelineEntry = TimelineEntryDerived

function formatDate(dateStr: string, lang: Language): string {
  return formatLocalizedDate(dateStr, lang, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getMonthName(m: number, lang: Language): string {
  return formatLocalizedDate(new Date(2020, m, 1), lang, { month: 'short' })
}

function getDayNameShort(dayIndex: number, lang: Language): string {
  return formatLocalizedDate(new Date(2020, 5, 7 + dayIndex), lang, { weekday: 'short' })
}

function getWeekOfMonth(iso: string): number {
  const d = new Date(iso)
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
  const dayOfWeek = firstDay.getDay()
  const adjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return Math.ceil((d.getDate() + adjusted) / 7)
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return 'var(--bg-tertiary)'
  const intensity = Math.min(1, count / Math.max(1, max))
  return `color-mix(in srgb, var(--bg-tertiary) ${100 - intensity * 70}%, var(--accent))`
}

export default function ProgressTimeline() {
  const { t, language } = useI18n()
  const lang = language
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const { questCompletionLogs, quests, questTitleOverrides, completedWorks } = useQuestStore(
    useShallow((s) => ({
      questCompletionLogs: s.questCompletionLogs,
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
      completedWorks: s.completedWorks,
    })),
  )

  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const streakState = useUIStore((s) => s.streakState)
  const lastShieldUsedOnDate = usePortraitStore((s) => s.lastShieldUsedOnDate)

  const [tooltip, setTooltip] = useState<{ entry: TimelineEntry; x: number; y: number } | null>(null)

  const questMap = useMemo(() => {
    const map = new Map<number, (typeof quests)[number]>()
    for (const q of quests) map.set(q.id, q)
    return map
  }, [quests])

  const workMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const w of completedWorks) {
      if (!map.has(w.questId) && w.imageUrl) map.set(w.questId, w.imageUrl)
    }
    return map
  }, [completedWorks])

  const logDerived = useMemo(
    () => getQuestLogDerivedStats(questCompletionLogs),
    [questCompletionLogs],
  )

  const practiceGraceDays = useMemo(
    () =>
      buildPracticeStreakGraceDays({
        lastShieldUsedOnDate,
        streakRecoveryDueDate: streakState.streakRecoveryDueDate,
      }),
    [lastShieldUsedOnDate, streakState.streakRecoveryDueDate],
  )

  const timelineData = useMemo(
    () =>
      buildTimelineMonthGroups({
        logs: questCompletionLogs,
        questMap,
        workThumbByQuestId: workMap,
        lang,
        questTitleOverrides,
        getWeekOfMonth,
      }),
    [questCompletionLogs, questMap, workMap, lang, questTitleOverrides],
  )

  const stats = useMemo(
    () => ({
      total: questCompletionLogs.length,
      dailyStreak: streakState.current,
      dailyBest: streakState.longest,
      practiceStreak: calculateCurrentStreak(logDerived.completionDates, practiceGraceDays),
      practiceBest: calculateBestStreak(logDerived.completionDates, practiceGraceDays),
      avgPerWeek: calculateAveragePerWeek(logDerived.completionDates),
    }),
    [questCompletionLogs.length, streakState, logDerived, practiceGraceDays],
  )

  const heatmapData = useMemo(() => {
    const dailyCounts = logDerived.dailyCounts
    const maxCount = logDerived.maxDailyCount

    const today = new Date()
    const yearAgo = new Date(today)
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const cells: { dateStr: string; count: number; month: number }[] = []
    const cursor = new Date(yearAgo)

    while (cursor <= today) {
      const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      cells.push({ dateStr: ds, count: dailyCounts.get(ds) ?? 0, month: cursor.getMonth() })
      cursor.setDate(cursor.getDate() + 1)
    }

    const monthStarts: { label: string; index: number }[] = []
    let lastMonth = -1
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].month !== lastMonth) {
        monthStarts.push({ label: getMonthName(cells[i].month, lang), index: i })
        lastMonth = cells[i].month
      }
    }

    const weeks: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }

    return { cells, weeks, monthStarts, maxCount }
  }, [logDerived, lang])

  useEffect(() => {
    if (!scrollRef.current || timelineData.length === 0) return
    const now = new Date()
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    let scrollIdx = timelineData.length - 1
    for (let i = 0; i < timelineData.length; i++) {
      const g = timelineData[i]
      const key = `${g.year}-${String(g.month + 1).padStart(2, '0')}`
      if (key >= currentKey) {
        scrollIdx = i
        break
      }
    }
    const el = scrollRef.current.children[scrollIdx] as HTMLElement
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' })
    }
  }, [timelineData])

  if (questCompletionLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-[var(--text-secondary)] mb-2">📭</p>
        <p className="text-sm text-[var(--text-muted)]">{t.progress.noCompletions}</p>
      </div>
    )
  }

  const timelineView = (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-0 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
        {timelineData.map((group) => {
          const key = `${group.year}-${String(group.month + 1).padStart(2, '0')}`
          const maxWeek = Math.max(1, ...group.entries.map(e => e.weekOfMonth))
          return (
            <div
              key={key}
              className="flex-shrink-0 relative border-r border-[var(--border-secondary)] px-3"
              style={{ width: 120, scrollSnapAlign: 'start' }}
            >
              <div className="text-xs font-semibold text-[var(--text-secondary)] sticky top-0 bg-[var(--bg-deep)] py-2 z-10 text-center">
                {getMonthName(group.month, lang)} {group.year}
              </div>
              <div className="flex flex-col items-center gap-3 pt-2" style={{ minHeight: 300 }}>
                {group.entries.map((entry, ei) => {
                  const topPct = ((entry.weekOfMonth - 1) / Math.max(1, maxWeek)) * 80 + 5
                  return (
                    <div
                      key={`${entry.questId}-${ei}`}
                      className="relative cursor-pointer rounded-full transition-transform hover:scale-150"
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: 'var(--accent)',
                        marginTop: ei === 0 ? `${topPct}%` : undefined,
                      }}
                      onClick={() => navigate(`/quests/${entry.questId}`)}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({ entry, x: rect.left + rect.width / 2, y: rect.top - 8 })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${entry.title} — ${t.progress.completedOn.replace('{date}', formatDate(entry.dateStr, lang))}`}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/quests/${entry.questId}`) }}
                    >
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
            {tooltip.entry.thumbnailUrl && (
              <img
                src={tooltip.entry.thumbnailUrl}
                alt=""
                className="w-full h-20 object-cover rounded mb-2"
              />
            )}
            <p className="font-semibold text-[var(--text-primary)] truncate">{tooltip.entry.title}</p>
            <p className="text-[var(--text-secondary)] mt-1">
              {t.progress.completedOn.replace('{date}', formatDate(tooltip.entry.dateStr, lang))}
            </p>
            <p className="text-[var(--accent)] font-medium mt-1">
              +{tooltip.entry.xpEarned} {t.common.xp}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const calendarView = (
    <div className="overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: 700 }}>
        <div className="flex flex-col gap-[3px] pr-2 pt-6 text-xs text-[var(--text-muted)]">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: 14, lineHeight: '14px' }}>{getDayNameShort(i, lang)}</div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {heatmapData.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.dateStr}
                  className="rounded-sm cursor-default"
                  style={{ width: 14, height: 14, backgroundColor: getHeatColor(cell.count, heatmapData.maxCount) }}
                  title={`${cell.count} ${t.progress.questsOnDate.replace('{count}', String(cell.count)).replace('{date}', cell.dateStr)}`}
                >
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-[3px] pl-8 mt-1 text-xs text-[var(--text-muted)]">
        {heatmapData.monthStarts.map((ms) => (
          <div key={ms.label} style={{ marginLeft: ms.index * 17 - (ms.index > 0 ? 0 : 0) }} className="flex-shrink-0">
            {ms.label}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.total}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{t.progress.totalCompleted}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.dailyStreak}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{t.stats.dailyStreak}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {t.stats.bestStreak.replace('{days}', String(stats.dailyBest))}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.practiceStreak}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{t.progress.practiceStreak}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {t.progress.practiceStreakBest.replace('{days}', String(stats.practiceBest))}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.avgPerWeek}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{t.progress.avgPerWeek}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-[var(--accent)] text-[var(--btn-on-accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          onClick={() => setViewMode('timeline')}
        >
          {t.progress.timeline}
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[var(--accent)] text-[var(--btn-on-accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          onClick={() => setViewMode('calendar')}
        >
          {t.progress.calendar}
        </button>
      </div>

      {viewMode === 'timeline' ? timelineView : calendarView}
    </div>
  )
}
