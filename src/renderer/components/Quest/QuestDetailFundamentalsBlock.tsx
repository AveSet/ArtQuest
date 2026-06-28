import { memo, useMemo } from 'react'
import {
  getFundamentalsBookPageNumbers,
  getFundamentalsTrackPhase,
  type FundamentalsExercise,
} from '@/data/fundamentalsExercises'
import FundamentalsBookPages from '@/components/Quest/FundamentalsBookPages'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import type { Language } from '@/i18n/translations'

type Props = {
  questId: number
  exercise: FundamentalsExercise
  lang: Language
  isActiveSession: boolean
  /** Session phase title shown above book pages during active session. */
  showPhaseTitle?: boolean
}

function useFundamentalsPhaseIndex(questId: number, isActiveSession: boolean): number | undefined {
  return useQuestSessionStore((s) => {
    if (!isActiveSession || s.session?.questId !== questId) return undefined
    const session = s.session
    if (!session.phases.length) return undefined
    const phase = session.phases[session.currentPhaseIndex]
    if (phase && phase.kind === 'fundamentals') return phase.phaseIndex
    return undefined
  })
}

function QuestDetailFundamentalsBlock({
  questId,
  exercise,
  lang,
  isActiveSession,
  showPhaseTitle = false,
}: Props) {
  const phaseIndex = useFundamentalsPhaseIndex(questId, isActiveSession)

  const phaseTitle = useMemo(() => {
    if (!showPhaseTitle || phaseIndex == null) return null
    const phase = getFundamentalsTrackPhase(exercise, phaseIndex)
    if (!phase) return null
    return phase.title[lang] ?? phase.title.en
  }, [showPhaseTitle, phaseIndex, exercise, lang])

  const hasMedia = useMemo(
    () => getFundamentalsBookPageNumbers(exercise, phaseIndex).length > 0,
    [exercise, phaseIndex],
  )

  if (showPhaseTitle && phaseTitle) {
    return (
      <>
        <p className="fundamentals-session-phase-title">{phaseTitle}</p>
        {hasMedia && isActiveSession ? (
          <FundamentalsBookPages exercise={exercise} hero phaseIndex={phaseIndex} questId={questId} />
        ) : null}
      </>
    )
  }

  if (hasMedia && isActiveSession) {
    return <FundamentalsBookPages exercise={exercise} hero phaseIndex={phaseIndex} questId={questId} />
  }

  if (!hasMedia) {
    return (
      <div className="mb-5 max-w-lg mx-auto">
        <FundamentalsBookPages exercise={exercise} questId={isActiveSession ? questId : undefined} />
      </div>
    )
  }

  return null
}

export default memo(QuestDetailFundamentalsBlock)
