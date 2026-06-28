import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n, getDifficultyLabel } from '@/i18n'
import {
  computeFlowMetrics,
  getDifficultyMultipliers,
  getRecommendedDifficultyShift,
} from '@/utils/adaptiveDifficulty'
import { collectLearningFocusTags } from '@/utils/learningFocus'
import { getMistakeTagLabel } from '@/utils/mistakeTags'
import type { Quest } from '@/store/models'

const DIFF_KEYS: Quest['difficulty'][] = ['novice', 'intermediate', 'advanced', 'master', 'expert']

export default function AdaptiveDifficultyInsight() {
  const { t, language } = useI18n()
  const lang = language
  const adaptiveWeights = useUIStore((s) => s.adaptiveWeights)
  const { logs, quests, completedWorks } = useQuestStore(
    useShallow((s) => ({
      logs: s.questCompletionLogs,
      quests: s.quests,
      completedWorks: s.completedWorks,
    })),
  )

  const insight = useMemo(() => {
    const metrics = computeFlowMetrics(logs, quests)
    const shift = getRecommendedDifficultyShift(metrics)
    const multipliers = getDifficultyMultipliers(adaptiveWeights, metrics)
    const focusTags = collectLearningFocusTags({ questCompletionLogs: logs, completedWorks }).slice(0, 3)
    return { metrics, shift, multipliers, focusTags }
  }, [logs, quests, adaptiveWeights, completedWorks])

  if (logs.length < 3) return null

  const shiftLabel =
    insight.shift === -1
      ? t.stats.adaptiveEasier
      : insight.shift === 1
        ? t.stats.adaptiveHarder
        : t.stats.adaptiveBalanced

  const maxMult = Math.max(...Object.values(insight.multipliers))

  return (
    <section className="card-fantasy p-5" aria-labelledby="adaptive-diff-title">
      <h3 id="adaptive-diff-title" className="heading-2 text-sm mb-2">
        {t.stats.adaptiveDifficulty}
      </h3>
      <p className="text-xs text-[var(--text-muted)] mb-3">{shiftLabel}</p>
      {insight.focusTags.length > 0 && (
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          {(t.stats.adaptiveFocusTags ?? 'Focus areas')}:{' '}
          {insight.focusTags.map((tag) => getMistakeTagLabel(tag, lang)).join(' · ')}
        </p>
      )}
      <div className="space-y-2" role="group" aria-label={t.stats.adaptiveDifficulty}>
        {DIFF_KEYS.map((key) => {
          const mult = insight.multipliers[key] ?? 1
          const pct = Math.round((mult / maxMult) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-0.5">
                <span>{getDifficultyLabel(key, lang)}</span>
                <span className="tabular-nums">{Math.round(mult * 100)}%</span>
              </div>
              <div className="h-2 rounded bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded bg-[var(--accent)]/80 transition-[width] motion-safe:duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
