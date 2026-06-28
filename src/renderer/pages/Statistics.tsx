import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n, getDifficultyLabel, getCategoryLabel } from '@/i18n'
import HabitsStrip from '@/components/HabitsStrip'
import StreakHeatmap from '@/components/StreakHeatmap'
import SkillRadarChart from '@/components/SkillRadarChart'
import AdaptiveDifficultyInsight from '@/components/AdaptiveDifficultyInsight'
import { ALL_CATEGORIES, type QuestCategory } from '@/data/skillTree'
import { skillCategoryBarClass, skillCategoryColor } from '@/utils/skillCategoryColors'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { buildMonthlyGrowthSummary } from '@/utils/monthlyGrowthSummary'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { resolveQuestById } from '@/utils/resolveQuestById'

/** Local date YYYY-MM-DD from ISO string */
function toLocalIsoDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Monday (local) date YYYY-MM-DD for week bucket */
function weekMondayIso(completedAtIso: string): string {
  const d = new Date(completedAtIso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(12, 0, 0, 0)
  return toLocalIsoDate(d.toISOString())
}

export default function Statistics() {
  const { questCompletionLogs, quests, questTitleOverrides } = useQuestStore(
    useShallow((s) => ({
      questCompletionLogs: s.questCompletionLogs,
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
    })),
  )
  const { t, language } = useI18n()
  const today = getLocalDateStr()
  const monthlySummary = useMemo(
    () => buildMonthlyGrowthSummary(questCompletionLogs, today, language),
    [questCompletionLogs, today, language],
  )
  const aggregates = useMemo(() => {
    const totalMinutes = questCompletionLogs.reduce(
      (s, log) => s + Math.max(0, Math.round(Number(log.practiceMinutes) || 0)),
      0,
    )
    const byCategory = new Map<string, number>()
    const byDifficulty = new Map<string, number>()
    const byWeekMinutes = new Map<string, number>()
    const questCounts = new Map<number, number>()
    let speedRuns = 0

    for (const log of questCompletionLogs) {
      const m = Math.max(1, Math.round(Number(log.practiceMinutes) || 0))
      const cat = log.category ?? 'unknown'
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + m)
      byDifficulty.set(log.difficulty, (byDifficulty.get(log.difficulty) ?? 0) + m)

      const wk = weekMondayIso(log.completedAt)
      byWeekMinutes.set(wk, (byWeekMinutes.get(wk) ?? 0) + m)

      questCounts.set(log.questId, (questCounts.get(log.questId) ?? 0) + 1)

      if (log.isSpeedRun) speedRuns += 1
    }

    const weekKeysSorted = [...byWeekMinutes.keys()].sort((a, b) => b.localeCompare(a)).slice(0, 12)
    const weekSeries = weekKeysSorted
      .map(k => ({ key: k, minutes: byWeekMinutes.get(k) ?? 0 }))
      .reverse()

    const maxWeek = Math.max(1, ...weekSeries.map(w => w.minutes))

    const topQuests = [...questCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const catTotals = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
    const maxCat = Math.max(1, ...catTotals.map(([, m]) => m))

    const diffOrder: Array<{ key: string; minutes: number }> = (
      ['novice', 'intermediate', 'advanced', 'expert', 'master'] as const
    )
      .map(key => ({
        key,
        minutes: byDifficulty.get(key) ?? 0,
      }))
      .filter(o => o.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)

    const maxDiff = Math.max(1, ...diffOrder.map(o => o.minutes))

    return {
      totalLogs: questCompletionLogs.length,
      totalMinutes,
      byCategory,
      weekSeries,
      maxWeek,
      topQuests,
      catTotals,
      maxCat,
      diffOrder,
      maxDiff,
      speedRuns,
      uniqueDays: new Set(questCompletionLogs.map(l => toLocalIsoDate(l.completedAt))).size,
      weekQuests: questCompletionLogs.filter((log) => {
        const t = new Date(log.completedAt).getTime()
        return t >= Date.now() - 7 * 86400000
      }).length,
      weekMinutes: questCompletionLogs.reduce((sum, log) => {
        const t = new Date(log.completedAt).getTime()
        if (t < Date.now() - 7 * 86400000) return sum
        return sum + Math.max(0, Math.round(Number(log.practiceMinutes) || 0))
      }, 0),
    }
  }, [questCompletionLogs])

  const lang = language

  if (aggregates.totalLogs === 0) {
    return (
      <div data-onboarding="page-statistics">
        <div className="card-fantasy text-center py-12 text-fantasy">
          {t.stats.empty}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-onboarding="page-statistics">
      <section className="card-fantasy p-4 border border-[var(--border-secondary)]">
        <h2 className="heading-4 mb-2">{t.sessionRitual?.monthlySummaryTitle ?? 'This month'}</h2>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>{(t.sessionRitual?.monthlySummaryQuests ?? '{count} quests completed').replace('{count}', String(monthlySummary.totalQuests))}</li>
          <li>{(t.sessionRitual?.monthlySummaryMinutes ?? '{minutes} min practiced').replace('{minutes}', String(monthlySummary.totalPracticeMinutes))}</li>
          {monthlySummary.topGrowthCategory ? (
            <li>
              {(t.sessionRitual?.monthlySummaryGrowth ?? 'Most growth: {category}').replace(
                '{category}',
                getCategoryLabel(monthlySummary.topGrowthCategory, language),
              )}
            </li>
          ) : null}
          {monthlySummary.topMistakeTag ? (
            <li>
              {(t.sessionRitual?.monthlySummaryMistake ?? 'Recurring focus: {tag}').replace(
                '{tag}',
                monthlySummary.topMistakeTag,
              )}
            </li>
          ) : null}
        </ul>
      </section>

      <HabitsStrip />

      <StreakHeatmap />

      <p className="text-xs text-[var(--text-muted)] -mt-2">{t.stats.streakExplainer}</p>

      <SkillRadarChart />

      <AdaptiveDifficultyInsight />

      {(aggregates.weekQuests > 0 || aggregates.weekMinutes > 0) && (
        <div className="card-fantasy py-4 px-5 border border-[var(--accent)]/30 bg-[var(--accent-muted)]/20" role="status">
          <p className="text-sm text-[var(--text-primary)] font-medium">
            {t.stats.weeklyInsight
              .replace('{quests}', String(aggregates.weekQuests))
              .replace('{minutes}', String(aggregates.weekMinutes))}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-fantasy text-center py-4">
          <div className="text-3xl font-bold text-[var(--accent-hover)] tabular-nums">{aggregates.totalLogs}</div>
          <div className="meta-fantasy text-sm mt-1">{t.stats.totalSessions}</div>
        </div>
        <div className="card-fantasy text-center py-4">
          <div className="text-3xl font-bold text-[var(--accent-hover)] tabular-nums">{aggregates.totalMinutes}</div>
          <div className="meta-fantasy text-sm mt-1">{t.stats.practiceMinutesTotal}</div>
        </div>
        <div className="card-fantasy text-center py-4">
          <div className="text-3xl font-bold text-[var(--accent-hover)] tabular-nums">{aggregates.uniqueDays}</div>
          <div className="meta-fantasy text-sm mt-1">{t.stats.activeDays}</div>
        </div>
      </div>

      <section className="card-fantasy p-6" aria-labelledby="stats-week-chart">
        <h2 id="stats-week-chart" className="heading-2 mb-4">{t.stats.weeklyPractice}</h2>
        <div className="flex items-end gap-2 h-40" role="group" aria-label={t.stats.weeklyPractice}>
          {aggregates.weekSeries.map(w => (
            <div key={w.key} className="flex-1 min-w-[2rem] flex flex-col justify-end gap-1">
              <span className="text-[10px] text-center text-[var(--text-muted)] tabular-nums">
                {w.minutes ? Math.round(w.minutes) : ''}
              </span>
              <div
                className="rounded-t bg-[var(--accent)]/70 border border-[var(--accent-hover)] min-h-[2px]"
                style={{ height: `${(w.minutes / aggregates.maxWeek) * 100}%` }}
                title={`${w.key}: ${w.minutes}`}
                aria-label={`${t.stats.weeklyPractice}. ${w.key}: ${Math.round(w.minutes)} min`}
                role="img"
              />
              <span className="text-[9px] text-center text-[var(--text-muted)] truncate" title={w.key}>
                {w.key.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="card-fantasy p-6" aria-labelledby="stats-category">
          <h2 id="stats-category" className="heading-2 mb-4">{t.stats.byCategory}</h2>
          <div className="space-y-2">
            {aggregates.catTotals.map(([cat, minutes]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    {ALL_CATEGORIES.includes(cat as QuestCategory) && (
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: skillCategoryColor(cat) }}
                        aria-hidden
                      />
                    )}
                    {cat === 'unknown'
                      ? t.stats.uncategorized
                      : ALL_CATEGORIES.includes(cat as QuestCategory)
                        ? getCategoryLabel(cat as QuestCategory, language)
                        : cat}
                  </span>
                  <span className="tabular-nums">{minutes} min</span>
                </div>
                <div className="h-2 rounded bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className={`h-full rounded ${ALL_CATEGORIES.includes(cat as QuestCategory) ? skillCategoryBarClass(cat) : ''}`}
                    style={{
                      width: `${(minutes / aggregates.maxCat) * 100}%`,
                      ...(ALL_CATEGORIES.includes(cat as QuestCategory)
                        ? {}
                        : { backgroundColor: 'var(--gold-primary)' }),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-fantasy p-6" aria-labelledby="stats-difficulty">
          <h2 id="stats-difficulty" className="heading-2 mb-4">{t.stats.byDifficulty}</h2>
          <div className="space-y-2">
            {aggregates.diffOrder.map(({ key, minutes }) => (
              <div key={key}>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-0.5">
                  <span>{getDifficultyLabel(key as keyof typeof t.difficulty, lang)}</span>
                  <span className="tabular-nums">{minutes} min</span>
                </div>
                <div className="h-2 rounded bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--status-success)] rounded"
                    style={{ width: `${(minutes / aggregates.maxDiff) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">{t.stats.speedRuns}: {aggregates.speedRuns}</p>
        </section>
      </div>

      <section className="card-fantasy p-6 overflow-x-auto" aria-labelledby="stats-top">
        <h2 id="stats-top" className="heading-2 mb-4">{t.stats.topQuests}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-secondary)]">
              <th scope="col" className="py-2 pr-3">#</th>
              <th scope="col" className="py-2 pr-3">{t.common.details}</th>
              <th scope="col" className="py-2 pr-3">{t.stats.timesCompleted}</th>
            </tr>
          </thead>
          <tbody>
            {aggregates.topQuests.map(([questId, count], idx) => {
              const q = resolveQuestById(questId, quests)
              const title = q ? resolveQuestTitle(q, lang, questTitleOverrides) : `Quest ${questId}`
              return (
                <tr key={questId} className="border-b border-[var(--border-secondary)]/60">
                  <td className="py-2 pr-3 tabular-nums">{idx + 1}</td>
                  <td className="py-2 pr-3 font-medium">{title}</td>
                  <td className="py-2 pr-3 tabular-nums">{count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
