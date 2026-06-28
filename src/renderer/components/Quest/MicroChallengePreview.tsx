import type { FC } from 'react'
import type { MicroChallenge } from '@/store/models'
import { useI18n } from '@/i18n'
import { orderMicroChallenges } from '@/utils/questSessionPlan'
import { phaseLabelKeyForChallenge } from '@/utils/microChallengeXp'

interface MicroChallengePreviewProps {
  challenges: MicroChallenge[]
}

function phaseLabel(
  key: ReturnType<typeof phaseLabelKeyForChallenge>,
  quests: Record<string, string | undefined>,
): string {
  if (key === 'warmup') return quests.phaseLabelWarmup ?? 'Warmup'
  if (key === 'core') return quests.phaseLabelCore ?? 'Core'
  if (key === 'polish') return quests.phaseLabelPolish ?? 'Polish'
  return quests.phaseLabelStep ?? 'Step'
}

/** Compact read-only session plan (steps run during the quest session). */
const MicroChallengePreview: FC<MicroChallengePreviewProps> = ({ challenges }) => {
  const { t, language } = useI18n()
  const lang = language
  const ordered = orderMicroChallenges(challenges)

  if (ordered.length === 0) return null

  return (
    <div className="micro-challenge-preview-block mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
        {t.quests.sessionPlanTitle}
      </p>
      <p className="text-xs text-[var(--text-muted)] mb-2">{t.quests.microChallengesSessionHint}</p>
      <ol className="micro-challenge-preview list-none m-0 p-0 space-y-1">
        {ordered.map((challenge, index) => {
          const labelKey = phaseLabelKeyForChallenge(challenge.id)
          return (
            <li
              key={challenge.id}
              className="micro-challenge-preview__row flex items-center gap-2 rounded-md border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/60 px-2 py-1.5 text-xs"
            >
              <span
                className="micro-challenge-preview__num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] font-semibold text-[var(--text-secondary)]"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="micro-challenge-preview__phase shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                {phaseLabel(labelKey, t.quests)}
              </span>
              <span className="micro-challenge-preview__text flex-1 min-w-0 text-[var(--text-primary)] leading-snug">
                {challenge.instruction[lang] || challenge.instruction.en}
              </span>
              <span className="micro-challenge-preview__meta shrink-0 text-[var(--text-muted)] whitespace-nowrap">
                {challenge.estimatedTime} {t.common.minutes}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default MicroChallengePreview
