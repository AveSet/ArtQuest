import type { Language } from '@/i18n/translations'
import type { Quest } from '@/store/models'
import type { QuestSession } from '@/store/useQuestSessionStore'
import { getSessionPhaseLabel } from '@/utils/questPhaseKeys'

export function getCurrentPhaseLabel(
  session: QuestSession,
  quest: Quest | undefined,
  lang: Language,
  referencePhaseLabel: string,
): string {
  if (!session.phases.length || session.phasesComplete) return ''
  const phase = session.phases[session.currentPhaseIndex]
  if (!phase) return ''
  return getSessionPhaseLabel(phase, quest, lang, referencePhaseLabel)
}

export function getPhaseTimerSec(session: QuestSession): number {
  if (session.phases.length > 0 && !session.phasesComplete) {
    return session.phaseRemainingSec
  }
  return session.remainingSec
}
