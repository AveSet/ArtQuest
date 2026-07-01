import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SessionOverlayPayload, QuestSessionCommand } from '@/types/electron'
import { expandSessionToMainWindow } from '@/utils/sessionOverlayActions'
import { applyThemeToDocument, useThemeStore } from '@/store/useThemeStore'

const EMPTY_PAYLOAD: SessionOverlayPayload = { hasSession: false }

function readInitialOverlayPayload(): SessionOverlayPayload {
  const snapshot = window.electronAPI?.overlay?.getSnapshot?.()
  if (snapshot?.hasSession) return snapshot
  return EMPTY_PAYLOAD
}

function send(command: QuestSessionCommand) {
  void window.electronAPI?.session?.dispatchCommand?.(command)
}

export default function QuestOverlay() {
  const [payload, setPayload] = useState<SessionOverlayPayload>(readInitialOverlayPayload)
  const cardRef = useRef<HTMLDivElement>(null)
  const lastReportedHeightRef = useRef(0)
  const theme = useThemeStore((s) => s.theme)

  const reportOverlaySize = useCallback(() => {
    if (!payload.hasSession || !cardRef.current) return
    const height = Math.ceil(cardRef.current.getBoundingClientRect().height)
    if (height < 1 || Math.abs(height - lastReportedHeightRef.current) < 2) return
    lastReportedHeightRef.current = height
    void window.electronAPI?.overlay?.setLayout?.({
      sessionType: payload.sessionType,
      contentHeight: height,
    })
  }, [payload])

  useLayoutEffect(() => {
    void window.electronAPI?.overlay?.notifyReady?.()
    void window.electronAPI?.overlay?.getPayload?.().then((res) => {
      if (res?.success && res.payload && typeof res.payload === 'object') {
        setPayload(res.payload)
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-window', '1')
    const unsubFull = window.electronAPI?.overlay?.onUpdate?.((next) => {
      setPayload(next)
    })
    const unsubPatch = window.electronAPI?.overlay?.onPatch?.((patch) => {
      setPayload((prev) => ({ ...prev, ...patch }))
    })
    return () => {
      document.documentElement.removeAttribute('data-overlay-window')
      unsubFull?.()
      unsubPatch?.()
    }
  }, [])

  useEffect(() => {
    const resolved = (payload.theme ?? theme) as 'modern' | 'light' | 'rpg'
    applyThemeToDocument(resolved)
  }, [payload.theme, theme])

  useEffect(() => {
    lastReportedHeightRef.current = 0
  }, [payload.sessionType, payload.questId, payload.nodeId])

  useLayoutEffect(() => {
    reportOverlaySize()
  }, [reportOverlaySize])

  useEffect(() => {
    const el = cardRef.current
    if (!el || !payload.hasSession) return
    const observer = new ResizeObserver(() => {
      reportOverlaySize()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [payload.hasSession, reportOverlaySize])

  const labels = payload.labels
  const isQuest = payload.sessionType === 'quest'
  const isPractice = payload.sessionType === 'practice'

  const handleNext = () => {
    if (isQuest) {
      if (payload.canAdvancePhase) {
        send('advancePhase')
        return
      }
      if (payload.canSubmitQuest) {
        send('openQuestFinish')
      }
      return
    }
    if (payload.canFinishPractice) {
      send('finishPractice')
    }
  }

  const nextLabel = () => {
    if (isPractice) return labels?.finish ?? 'Finish'
    if (payload.canAdvancePhase) return labels?.next ?? 'Next'
    if (payload.canSubmitQuest) return labels?.submit ?? labels?.next ?? 'Submit'
    return labels?.next ?? 'Next'
  }

  const nextDisabled = isQuest
    ? !payload.canAdvancePhase && !payload.canSubmitQuest
    : !payload.canFinishPractice

  const handleOpenReferences = () => {
    send('openReferences')
  }

  const handleCancel = () => {
    if (isQuest) {
      send('cancelQuestSession')
      return
    }
    send('cancelPractice')
  }

  return (
    <div className="quest-overlay-shell">
      <div
        ref={cardRef}
        className={`quest-overlay-card${isPractice ? ' quest-overlay-card--practice' : ''}${payload.isReferencePhase ? ' quest-overlay-card--reference' : ''}${payload.isExpired ? ' quest-overlay-card--expired' : ''}${payload.isTimerPaused ? ' quest-overlay-card--paused' : ''}`}
      >
        <div className="quest-overlay-drag">
          <span className="quest-overlay-kicker">ArtQuest</span>
          <button
            type="button"
            className="quest-overlay-close"
            aria-label={labels?.close ?? labels?.expand ?? 'Open main window'}
            title={labels?.close ?? labels?.expand ?? 'Open main window'}
            onClick={() => expandSessionToMainWindow()}
          >
            ⤢
          </button>
        </div>

        {payload.hasSession ? (
          <>
            {payload.phaseLabel && isQuest ? (
              <div className="quest-overlay-phase quest-overlay-phase--primary" title={payload.phaseLabel}>
                {payload.phaseLabel}
              </div>
            ) : (
              <div className="quest-overlay-title" title={payload.questTitle}>
                {payload.questTitle}
              </div>
            )}
            <div
              className={`quest-overlay-time${payload.isExpired ? ' quest-overlay-time--expired' : ''}${payload.isTimerPaused ? ' quest-overlay-time--paused' : ''}`}
            >
              {payload.timerLabel ?? '00:00'}
            </div>
            {payload.isTimerPaused ? (
              <p className="quest-overlay-paused-hint">{labels?.timerPaused}</p>
            ) : null}
            {payload.inGracePeriod && labels?.gracePeriodHint ? (
              <p className="quest-overlay-grace-hint">
                {labels.gracePeriodHint.replace('{time}', payload.timerLabel ?? '')}
              </p>
            ) : null}

            <div className="quest-overlay-actions quest-overlay-actions--triple">
              <button
                type="button"
                className="quest-overlay-actions__primary"
                onClick={handleNext}
                disabled={nextDisabled}
              >
                {nextLabel()}
              </button>
              <button
                type="button"
                className="quest-overlay-actions__reference"
                onClick={handleOpenReferences}
              >
                {labels?.references ?? labels?.needReferences ?? 'Reference'}
              </button>
              <button
                type="button"
                className="quest-overlay-actions__danger"
                onClick={handleCancel}
              >
                {labels?.cancel ?? 'Cancel'}
              </button>
            </div>
          </>
        ) : (
          <div className="quest-overlay-empty">
            <div className="quest-overlay-title">ArtQuest</div>
            <p>{labels?.overlayEmpty ?? 'Start a quest or practice to see the timer here.'}</p>
            <button type="button" onClick={() => expandSessionToMainWindow()}>
              {labels?.expand ?? labels?.open ?? 'Open'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
