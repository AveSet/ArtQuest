import { useMemo } from 'react'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n } from '@/i18n'
import { buildStreakHeatmap, practiceDaysFromLogs } from '@/utils/streakHeatmap'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function StreakHeatmap() {
  const { t } = useI18n()
  const logs = useQuestStore((s) => s.questCompletionLogs)

  const activeDays = useMemo(() => practiceDaysFromLogs(logs), [logs])

  const grid = useMemo(() => buildStreakHeatmap(activeDays, 12), [activeDays])

  if (activeDays.length === 0) return null

  const columns = Array.from({ length: grid.weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, row) => grid.cells[week * 7 + row]),
  )

  return (
    <section className="card-fantasy p-4" aria-labelledby="streak-heatmap-title">
      <h3 id="streak-heatmap-title" className="heading-2 text-sm mb-3">
        {t.stats.practiceHeatmap}
      </h3>
      <div className="streak-heatmap flex gap-2 items-start overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pt-5 text-[9px] text-[var(--text-muted)] shrink-0" aria-hidden>
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="h-[11px] leading-[11px]">
              {i % 2 === 0 ? label : ''}
            </span>
          ))}
        </div>
        <div
          className="streak-heatmap__grid flex gap-[3px]"
          role="img"
          aria-label={t.stats.practiceHeatmapAria.replace('{days}', String(activeDays.length))}
        >
          {columns.map((col, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell?.date ?? weekIdx}
                  className={`streak-heatmap__cell${cell?.active ? ' streak-heatmap__cell--active' : ''}`}
                  title={cell ? `${cell.date}${cell.active ? ' ✓' : ''}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">{t.stats.practiceHeatmapHint}</p>
    </section>
  )
}
