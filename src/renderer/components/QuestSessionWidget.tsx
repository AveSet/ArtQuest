import { memo } from 'react'
import { Link, useLocation } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useQuestSessionStore, isSessionInReferencePhase, sessionHasPhases } from '@/store/useQuestSessionStore'
import { useQuestStore } from '@/store/useQuestStore'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { buildQuestDetailNavState, resolveQuestById } from '@/utils/resolveQuestById'
import { useI18n } from '@/i18n'
import QuestSessionPhaseTimer from '@/components/Quest/QuestSessionPhaseTimer'
import QuestSplitTimer from '@/components/QuestSplitTimer'

/** Hide navbar widget only on the active quest detail page (full session UI is shown there). */
function isActiveQuestDetailRoute(pathname: string, questId: number): boolean {
  return pathname === `/quests/${questId}`
}

const QuestSessionWidget = memo(function QuestSessionWidget() {
  const location = useLocation()
  const sessionMeta = useQuestSessionStore(
    useShallow((s) => {
      const session = s.session
      if (!session) return null
      const currentPhase = session.phases[session.currentPhaseIndex]?.kind ?? 'none'
      const phased = sessionHasPhases(session) && !session.phasesComplete
      return {
        questId: session.questId,
        isExpired: session.isExpired,
        isReferencePhase: isSessionInReferencePhase(session),
        phased,
        phaseKey: `${session.currentPhaseIndex}:${currentPhase}:${session.phasesComplete ? 1 : 0}`,
      }
    }),
  )
  const { language } = useI18n()
  const { quests, questTitleOverrides } = useQuestStore(
    useShallow((s) => ({
      quests: s.quests,
      questTitleOverrides: s.questTitleOverrides,
    })),
  )

  if (!sessionMeta || isActiveQuestDetailRoute(location.pathname, sessionMeta.questId)) return null

  const quest = resolveQuestById(sessionMeta.questId, quests)
  if (!quest) return null

  const title = resolveQuestTitle(quest, language, questTitleOverrides)
  const showTitle = !sessionMeta.phased
  const widgetClass = [
    'quest-session-widget',
    sessionMeta.isExpired ? 'quest-session-widget--expired' : '',
    sessionMeta.isReferencePhase ? 'quest-session-widget--reference' : '',
    sessionMeta.phased ? 'quest-session-widget--phased' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={widgetClass}>
      <Link
        to={`/quests/${sessionMeta.questId}`}
        state={buildQuestDetailNavState(sessionMeta.questId)}
        className="quest-session-widget__link"
        title={title}
        aria-label={title}
      >
        {showTitle ? <span className="quest-session-widget__label">{title}</span> : null}
        <QuestSessionWidgetTimer questId={sessionMeta.questId} phased={sessionMeta.phased} />
      </Link>
    </div>
  )
})

const QuestSessionWidgetTimer = memo(function QuestSessionWidgetTimer({
  questId,
  phased,
}: {
  questId: number
  phased: boolean
}) {
  const session = useQuestSessionStore((s) => (s.session?.questId === questId ? s.session : null))
  if (!session) return null
  return phased ? (
    <QuestSessionPhaseTimer
      session={session}
      size="sm"
      layout="stack"
      showPhaseMeta
      className="quest-session-widget__phase quest-phase-timer--navbar"
    />
  ) : (
    <QuestSplitTimer session={session} size="sm" className="quest-session-widget__split" />
  )
})

export default QuestSessionWidget
