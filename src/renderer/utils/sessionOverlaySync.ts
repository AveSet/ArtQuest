import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useActivityStore } from '@/store/useActivityStore'
import {
  formatOvertimeElapsed,
  formatSessionRemaining,
  isSessionInReferencePhase,
  sessionHasPhases,
  sessionInOvertime,
  useQuestSessionStore,
  type QuestSession,
} from '@/store/useQuestSessionStore'
import { resolveQuestTitle } from '@/utils/questDisplay'
import { resolveQuestById } from '@/utils/resolveQuestById'
import { getCurrentPhaseLabel, getPhaseTimerSec } from '@/utils/sessionPhaseDisplay'
import { hideSessionOverlay } from '@/utils/sessionOverlayActions'
import { syncTaskbarProgress } from '@/utils/syncTaskbarProgress'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import { getReferenceYoutubeButtonLabels } from '@/utils/referenceYtLabels'
import type { Language, translations } from '@/i18n/translations'

type TBundle = (typeof translations)[Language]

type OverlayPayload = Parameters<
  NonNullable<typeof window.electronAPI>['overlay']['setPayload']
>[0]

let lastStableKey = ''
let lastTimerLabel = ''
let lastSyncFingerprint = ''

function formatPracticeElapsed(activeElapsedSec: number): string {
  const sec = Math.max(0, Math.floor(activeElapsedSec))
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

export function buildSessionOverlayPayload(language: Language, t: TBundle): OverlayPayload {
  const theme = useThemeStore.getState().theme
  const session = useQuestSessionStore.getState().session
  const practiceSession = useSkillPracticeStore.getState().session
  const quests = useQuestStore.getState().quests
  const questTitleOverrides = useQuestStore.getState().questTitleOverrides
  const skillNodes = useSkillStore.getState().skillNodes
  const shouldCountTime = useActivityStore.getState().shouldCountTime

  const ytLabels = getReferenceYoutubeButtonLabels(language)
  const labels = {
    needReferences: t.quests.needReferences ?? 'Need references?',
    youtubeLong: ytLabels.long,
    youtubeShort: ytLabels.short,
    pinterest: t.quests.referencePinterest ?? 'Pinterest',
    clipTips: t.quests.referenceClipTips ?? 'CSP Tips',
    sketchfab: t.quests.referenceSketchfab ?? 'Sketchfab',
    next: t.quests.sessionPhaseNext ?? t.settings.shortcutAdvance ?? 'Next',
    references: t.quests.overlayReference ?? t.quests.needReferences ?? 'Reference',
    submit: t.common.submit ?? 'Submit',
    expand: t.common.open ?? 'Open',
    collapse: t.skills.collapseToWidget ?? 'Collapse to widget',
    cancel: t.quests.overlayCancelQuest ?? t.common.cancel ?? 'Cancel',
    open: t.common.open ?? 'Open',
    close: t.quests.sessionOverlayExpandAria ?? t.common.open ?? 'Open',
    finish: t.skills.endPractice ?? 'Finish',
    timerPaused: t.skills.practiceArtAppPausedHint,
    gracePeriodHint: t.quests.gracePeriodHint,
    overtimeHint: t.quests.overtimeHint,
    overlayEmpty: t.quests.sessionOverlayEmptyHint,
    practiceMinHint: t.skills.practiceMinArtAppHint,
  }

  const isTimerPaused = !!practiceSession && !session && !shouldCountTime

  if (session) {
    const quest = resolveQuestById(session.questId, quests)
    const phaseLabel = getCurrentPhaseLabel(session, quest, language, t.quests.referencePhaseLabel)
    const inOvertime = sessionInOvertime(session)
    const timerLabel = session.isExpired
      ? formatOvertimeElapsed(session.overtimeElapsedSec ?? 0)
      : formatSessionRemaining(getPhaseTimerSec(session))
    const inActivePhases = sessionHasPhases(session) && !session.phasesComplete
    return {
      hasSession: true,
      sessionType: 'quest',
      theme,
      lang: language,
      questId: session.questId,
      category: quest?.category,
      preferredTags: quest?.tags ?? [],
      questTitle: quest ? resolveQuestTitle(quest, language, questTitleOverrides) : `Quest #${session.questId}`,
      timerLabel,
      phaseLabel,
      isRunning: session.isRunning,
      isExpired: session.isExpired,
      isTimerPaused,
      canAdvancePhase: inActivePhases,
      canSubmitQuest: !inActivePhases,
      canFinishPractice: false,
      inGracePeriod: inOvertime,
      isReferencePhase: isSessionInReferencePhase(session),
      labels,
    }
  }

  if (practiceSession) {
    const staticNode = SKILL_TREE_NODES.find((n) => n.id === practiceSession.nodeId)
    const runtimeNode = skillNodes.find((n) => n.id === practiceSession.nodeId)
    const title =
      runtimeNode?.title[language] ||
      runtimeNode?.title.en ||
      staticNode?.title[language] ||
      staticNode?.title.en ||
      practiceSession.nodeId
    const practiceReadyToFinish = practiceSession.activeElapsedSec >= 60
    return {
      hasSession: true,
      sessionType: 'practice',
      theme,
      lang: language,
      nodeId: practiceSession.nodeId,
      category: practiceSession.category,
      preferredTags: staticNode?.tags ?? runtimeNode?.tags ?? [],
      questTitle: title,
      timerLabel: formatPracticeElapsed(practiceSession.activeElapsedSec),
      phaseLabel: t.skills.activePractice ?? t.skills.start_practice,
      isRunning: true,
      isExpired: false,
      isTimerPaused,
      canAdvancePhase: false,
      canSubmitQuest: false,
      canFinishPractice: practiceReadyToFinish,
      isReferencePhase: false,
      labels: {
        ...labels,
        cancel: t.skills.cancelPractice ?? t.common.cancel ?? 'Cancel',
        finish: practiceReadyToFinish
          ? (t.skills.endPractice ?? 'Finish')
          : (t.skills.cancelPractice ?? t.common.cancel),
      },
    }
  }

  return { hasSession: false, theme, labels }
}

/** Coarse fingerprint — skip overlay rebuild when unrelated store updates fire. */
export function sessionOverlaySyncFingerprint(): string {
  const theme = useThemeStore.getState().theme
  const session = useQuestSessionStore.getState().session
  const practiceSession = useSkillPracticeStore.getState().session
  const shouldCountTime = useActivityStore.getState().shouldCountTime

  if (session) {
    const quest = resolveQuestById(session.questId, useQuestStore.getState().quests)
    return [
      'quest',
      session.questId,
      session.isRunning,
      session.isExpired,
      session.phasesComplete,
      session.currentPhaseIndex,
      session.graceExpired,
      theme,
      shouldCountTime,
      quest?.category ?? '',
      (quest?.tags ?? []).join(','),
      Object.keys(useQuestStore.getState().questTitleOverrides).length,
    ].join('|')
  }

  if (practiceSession) {
    return [
      'practice',
      practiceSession.nodeId,
      practiceSession.category,
      theme,
      shouldCountTime,
    ].join('|')
  }

  return `idle:${theme}`
}

/** Push timer-only overlay patch on 1 Hz session ticks without rebuilding full payload. */
export function syncSessionOverlayTimerOnly(language: Language, t: TBundle): void {
  const api = window.electronAPI
  if (!api?.overlay?.setPatch) return
  const session = useQuestSessionStore.getState().session
  const practiceSession = useSkillPracticeStore.getState().session
  const shouldCountTime = useActivityStore.getState().shouldCountTime
  if (!session && !practiceSession) return

  const quests = useQuestStore.getState().quests
  const quest = session ? resolveQuestById(session.questId, quests) : undefined

  const nextTimer = session
    ? session.isExpired
      ? formatOvertimeElapsed(session.overtimeElapsedSec ?? 0)
      : formatSessionRemaining(getPhaseTimerSec(session))
    : formatPracticeElapsed(practiceSession?.activeElapsedSec ?? 0)
  if (nextTimer === lastTimerLabel) return
  lastTimerLabel = nextTimer
  const inActivePhases = session ? sessionHasPhases(session) && !session.phasesComplete : false
  const practiceReadyToFinish = practiceSession ? practiceSession.activeElapsedSec >= 60 : false
  void api.overlay.setPatch({
    timerLabel: nextTimer,
    phaseLabel: session
      ? getCurrentPhaseLabel(session, quest, language, t.quests.referencePhaseLabel)
      : (t.skills.activePractice ?? t.skills.start_practice),
    isRunning: session?.isRunning ?? Boolean(practiceSession),
    isExpired: session?.isExpired ?? false,
    isTimerPaused: Boolean(practiceSession && !session && !shouldCountTime),
    canAdvancePhase: inActivePhases,
    canSubmitQuest: session ? !inActivePhases : false,
    canFinishPractice: practiceReadyToFinish,
    inGracePeriod: session ? sessionInOvertime(session) : false,
    isReferencePhase: session ? isSessionInReferencePhase(session) : false,
  })
}

export function syncSessionOverlayPayload(language: Language, t: TBundle): void {
  const fingerprint = sessionOverlaySyncFingerprint()
  if (fingerprint === lastSyncFingerprint) return
  lastSyncFingerprint = fingerprint
  const api = window.electronAPI
  if (!api?.overlay?.setPayload) return

  const payload = buildSessionOverlayPayload(language, t)

  if (!payload.hasSession) {
    const stableKey = JSON.stringify({ hasSession: false, theme: payload.theme })
    if (stableKey !== lastStableKey) {
      lastStableKey = stableKey
      lastTimerLabel = ''
      void api.overlay.setPayload(payload)
    }
    hideSessionOverlay()
    void api.overlay.setSessionActive?.(false)
    syncTaskbarProgress()
    return
  }

  void api.overlay.setSessionActive?.(true)
  syncTaskbarProgress()

  const { timerLabel, ...stablePart } = payload
  const stableKey = JSON.stringify(stablePart)
  if (stableKey !== lastStableKey) {
    lastStableKey = stableKey
    lastTimerLabel = timerLabel ?? ''
    void api.overlay.setPayload(payload)
    return
  }

  const nextTimer = timerLabel ?? ''
  if (nextTimer !== lastTimerLabel && api.overlay.setPatch) {
    lastTimerLabel = nextTimer
    void api.overlay.setPatch({
      timerLabel: nextTimer,
      phaseLabel: payload.phaseLabel,
      isRunning: payload.isRunning,
      isExpired: payload.isExpired,
      isTimerPaused: payload.isTimerPaused,
      canAdvancePhase: payload.canAdvancePhase,
      canSubmitQuest: payload.canSubmitQuest,
      canFinishPractice: payload.canFinishPractice,
      inGracePeriod: payload.inGracePeriod,
      isReferencePhase: payload.isReferencePhase,
    })
  }
}

/** @internal Vitest only */
export function resetSessionOverlaySyncForTests(): void {
  lastStableKey = ''
  lastTimerLabel = ''
  lastSyncFingerprint = ''
}

export function resetSessionOverlaySyncCache(): void {
  lastStableKey = ''
  lastTimerLabel = ''
  lastSyncFingerprint = ''
}

/** Force-push full overlay payload (bypasses fingerprint dedup). Use before manual collapse. */
export async function forceSyncSessionOverlayPayload(
  language: Language,
  t: TBundle,
): Promise<boolean> {
  const api = window.electronAPI
  if (!api?.overlay?.setPayload) return false

  resetSessionOverlaySyncCache()
  lastSyncFingerprint = sessionOverlaySyncFingerprint()

  const payload = buildSessionOverlayPayload(language, t)
  if (!payload.hasSession) return false

  const { timerLabel, ...stablePart } = payload
  lastStableKey = JSON.stringify(stablePart)
  lastTimerLabel = timerLabel ?? ''

  void api.overlay.setSessionActive?.(true)
  const result = await api.overlay.setPayload(payload)
  return result?.success !== false
}

export function sessionOverlayAutoExpandTarget(session: QuestSession | null): number | null {
  if (!session) return null
  const ready =
    (session.phases.length > 0 && session.phasesComplete) ||
    (session.phases.length === 0 && session.isExpired)
  return ready ? session.questId : null
}
