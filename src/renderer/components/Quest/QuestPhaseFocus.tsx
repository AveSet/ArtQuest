import type { QuestSession } from '@/store/useQuestSessionStore'
import { useI18n } from '@/i18n'
import { sessionHasPhases } from '@/store/useQuestSessionStore'
import QuestSessionPhaseTimer from '@/components/Quest/QuestSessionPhaseTimer'

type QuestPhaseFocusProps = {
  session: QuestSession
}

export default function QuestPhaseFocus({ session }: QuestPhaseFocusProps) {
  const { t } = useI18n()

  if (!sessionHasPhases(session) || session.phasesComplete) {
    return (
      <div className="quest-phase-focus mb-4 text-center space-y-3" aria-live="polite">
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          {t.quests.sessionPhasesComplete}
        </p>
        <QuestSessionPhaseTimer session={session} size="lg" />
      </div>
    )
  }

  return (
    <div className="quest-phase-focus mb-4 max-w-lg mx-auto w-full" aria-live="polite">
      <p className="quest-phase-focus__step text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
        {t.quests.sessionCurrentPhase
          .replace('{current}', String(session.currentPhaseIndex + 1))
          .replace('{total}', String(session.phases.length))}
      </p>
      <QuestSessionPhaseTimer session={session} size="lg" framedLabel showPhaseMeta />
    </div>
  )
}
