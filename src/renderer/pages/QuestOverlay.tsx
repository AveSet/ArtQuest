import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MaterialVideoMode } from '@/utils/materialExternalCatalog'
import type { SessionOverlayPayload, QuestSessionCommand } from '@/types/electron'
import { openReferenceWindow } from '@/utils/openReferenceWindow'
import { applyThemeToDocument, useThemeStore } from '@/store/useThemeStore'
import { cancelSessionFromOverlay, expandSessionToMainWindow } from '@/utils/sessionOverlayActions'

const EMPTY_PAYLOAD: SessionOverlayPayload = { hasSession: false }

function readInitialOverlayPayload(): SessionOverlayPayload {
  const snapshot = window.electronAPI?.getQuestOverlaySnapshot?.()
  if (snapshot?.hasSession) return snapshot
  return EMPTY_PAYLOAD
}

function send(command: QuestSessionCommand) {
  void window.electronAPI?.dispatchQuestSessionCommand?.(command)
}

export default function QuestOverlay() {
  const [payload, setPayload] = useState<SessionOverlayPayload>(readInitialOverlayPayload)
  const [refsOpen, setRefsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const lastReportedHeightRef = useRef(0)
  const theme = useThemeStore((s) => s.theme)

  const reportOverlaySize = useCallback(() => {
    if (!payload.hasSession || !cardRef.current) return
    const height = Math.ceil(cardRef.current.getBoundingClientRect().height)
    if (height < 1 || Math.abs(height - lastReportedHeightRef.current) < 2) return
    lastReportedHeightRef.current = height
    void window.electronAPI?.setOverlayLayout?.({
      sessionType: payload.sessionType,
      refsOpen,
      contentHeight: height,
    })
  }, [payload, refsOpen])

  useLayoutEffect(() => {
    void window.electronAPI?.notifyOverlayReady?.()
    void window.electronAPI?.getQuestOverlayPayload?.().then((res) => {
      if (res?.success && res.payload && typeof res.payload === 'object') {
        setPayload(res.payload)
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-overlay-window', '1')
    const unsubFull = window.electronAPI?.onQuestOverlayUpdate?.((next) => {
      setPayload(next)
    })
    const unsubPatch = window.electronAPI?.onQuestOverlayPatch?.((patch) => {
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
    setRefsOpen(false)
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

  const openRef = (mode: MaterialVideoMode) => {
    openReferenceWindow({
      mode,
      questId: payload.questId,
      nodeId: payload.nodeId,
      category: payload.category,
      tags: payload.preferredTags ?? [],
      lang: payload.lang,
    })
    setRefsOpen(false)
  }

  const primaryQuestCommand = (): QuestSessionCommand => {
    if (payload.canAdvancePhase) return 'advancePhase'
    if (payload.canSubmitQuest) return 'openQuestFinish'
    return 'showMainWindow'
  }

  const primaryQuestLabel = () => {
    if (payload.canAdvancePhase) return labels?.next ?? 'Next'
    if (payload.canSubmitQuest) return labels?.submit ?? 'Submit'
    return labels?.expand ?? 'Expand'
  }

  return (
    <div className="quest-overlay-shell">
      <div
        ref={cardRef}
        className={`quest-overlay-card${isPractice ? ' quest-overlay-card--practice' : ''}${refsOpen ? ' quest-overlay-card--refs-open' : ''}${payload.isReferencePhase ? ' quest-overlay-card--reference' : ''}${payload.isExpired ? ' quest-overlay-card--expired' : ''}${payload.isTimerPaused ? ' quest-overlay-card--paused' : ''}`}
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

            <button
              type="button"
              className="quest-overlay-refs-toggle"
              onClick={() => setRefsOpen((v) => !v)}
              aria-expanded={refsOpen}
              aria-controls="quest-overlay-ref-grid"
            >
              {labels?.needReferences ?? 'Need references?'}
            </button>

            {refsOpen ? (
              <div id="quest-overlay-ref-grid" className="quest-overlay-ref-grid">
                <button type="button" onClick={() => openRef('long')}>
                  ▶ {labels?.youtubeLong ?? 'YT Long'}
                </button>
                <button type="button" onClick={() => openRef('short')}>
                  ▶ {labels?.youtubeShort ?? 'YT Short'}
                </button>
                <button type="button" onClick={() => openRef('pinterest')}>
                  📌 {labels?.pinterest ?? 'Pin'}
                </button>
                <button type="button" onClick={() => openRef('clipTips')}>
                  🎨 {labels?.clipTips ?? 'CSP'}
                </button>
                <button type="button" className="quest-overlay-ref-grid__wide" onClick={() => openRef('sketchfab')}>
                  🧊 {labels?.sketchfab ?? '3D'}
                </button>
              </div>
            ) : null}

            <div className="quest-overlay-actions">
              {isQuest ? (
                <>
                  <button
                    type="button"
                    className="quest-overlay-actions__primary"
                    onClick={() => send(primaryQuestCommand())}
                    disabled={
                      !payload.canAdvancePhase &&
                      !payload.canSubmitQuest &&
                      primaryQuestCommand() === 'advancePhase'
                    }
                  >
                    {primaryQuestLabel()}
                  </button>
                  <button
                    type="button"
                    className="quest-overlay-actions__danger"
                    onClick={() => cancelSessionFromOverlay()}
                  >
                    {labels?.cancel ?? 'Cancel'}
                  </button>
                </>
              ) : payload.canFinishPractice ? (
                <button
                  type="button"
                  className="quest-overlay-actions__primary quest-overlay-actions__wide"
                  onClick={() => send('finishPractice')}
                >
                  {labels?.finish ?? 'Finish'}
                </button>
              ) : (
                <button
                  type="button"
                  className="quest-overlay-actions__danger quest-overlay-actions__wide"
                  onClick={() => send('cancelPractice')}
                >
                  {labels?.cancel ?? 'Cancel'}
                </button>
              )}
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
