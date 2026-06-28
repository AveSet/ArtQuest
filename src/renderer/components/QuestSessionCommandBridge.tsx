import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useActivityStore } from '@/store/useActivityStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { buildQuestDetailNavState, resolveQuestById } from '@/utils/resolveQuestById'
import { openReferenceWindow } from '@/utils/openReferenceWindow'
import { finishSkillPracticeSession } from '@/utils/skillPracticeFinish'
import { cancelSkillPracticeSession } from '@/utils/skillPracticeCancel'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import { dispatchQuestOpenFinishFlow } from '@/utils/questSessionEvents'
import { expandSessionToMainWindow } from '@/utils/sessionOverlayActions'
import { playSound } from '@/utils/sound'
import {
  resetSessionOverlaySyncCache,
  sessionOverlayAutoExpandTarget,
  syncSessionOverlayPayload,
} from '@/utils/sessionOverlaySync'

export const REFERENCE_PANEL_TOGGLE_EVENT = 'artquest:toggle-reference-panel'

export default function QuestSessionCommandBridge() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const autoExpandedQuestRef = useRef<number | null>(null)

  useEffect(() => {
    return useQuestSessionStore.subscribe((state) => {
      const target = sessionOverlayAutoExpandTarget(state.session)
      if (target == null) {
        autoExpandedQuestRef.current = null
        return
      }
      if (autoExpandedQuestRef.current === target) return
      autoExpandedQuestRef.current = target
      expandSessionToMainWindow()
      navigate(`/quests/${target}`, {
        state: buildQuestDetailNavState(target),
      })
      dispatchQuestOpenFinishFlow()
    })
  }, [navigate])

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onQuestSessionCommand?.((command) => {
      const store = useQuestSessionStore.getState()
      const activeSession = store.session
      if (command === 'advancePhase') {
        store.advancePhase()
        return
      }
      if (command === 'finishPractice') {
        expandSessionToMainWindow()
        const result = finishSkillPracticeSession()
        if (result) navigate('/skills')
        return
      }
      if (command === 'cancelPractice') {
        expandSessionToMainWindow()
        cancelSkillPracticeSession()
        navigate('/skills')
        return
      }
      if (command === 'cancelQuestSession') {
        if (activeSession) {
          const quest = resolveQuestById(activeSession.questId, useQuestStore.getState().quests)
          playSound('questAbandon', quest?.category)
        }
        store.cancelSession()
        navigate('/', { replace: true })
        return
      }
      if (command === 'openReferences') {
        if (activeSession) {
          const quest = resolveQuestById(activeSession.questId, useQuestStore.getState().quests)
          openReferenceWindow({
            mode: 'long',
            questId: activeSession.questId,
            category: quest?.category,
            tags: quest?.tags ?? [],
            lang: language,
          })
          return
        }
        const practice = useSkillPracticeStore.getState().session
        if (practice) {
          const staticNode = SKILL_TREE_NODES.find((n) => n.id === practice.nodeId)
          const runtimeNode = useSkillStore.getState().skillNodes.find((n) => n.id === practice.nodeId)
          openReferenceWindow({
            mode: 'long',
            nodeId: practice.nodeId,
            category: practice.category,
            tags: staticNode?.tags ?? runtimeNode?.tags ?? [],
            lang: language,
          })
        }
        return
      }
      if (command === 'openQuestFinish') {
        if (activeSession) {
          navigate(`/quests/${activeSession.questId}`, {
            state: buildQuestDetailNavState(activeSession.questId),
          })
          dispatchQuestOpenFinishFlow()
        }
        return
      }
      if (command === 'showMainWindow') {
        const practice = useSkillPracticeStore.getState().session
        if (practice && !activeSession) {
          navigate('/skills')
          return
        }
        if (activeSession) {
          navigate(`/quests/${activeSession.questId}`, {
            state: buildQuestDetailNavState(activeSession.questId),
          })
        }
      }
    })
    return () => unsubscribe?.()
  }, [language, navigate])

  useEffect(() => {
    const sync = () => syncSessionOverlayPayload(language, t)
    const unsubs = [
      useQuestSessionStore.subscribe(sync),
      useSkillPracticeStore.subscribe(sync),
      useThemeStore.subscribe(sync),
      useActivityStore.subscribe(sync),
    ]
    const unsubOverlaySync = window.electronAPI?.onOverlayRequestSync?.(() => {
      resetSessionOverlaySyncCache()
      sync()
    })
    sync()
    return () => {
      for (const unsub of unsubs) unsub()
      unsubOverlaySync?.()
    }
  }, [language, t])

  return null
}
