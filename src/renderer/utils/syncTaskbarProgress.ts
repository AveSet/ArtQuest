import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import {
  computePracticeTaskbarProgress,
  computeQuestSessionTaskbarProgress,
  taskbarProgressHidden,
} from '@/utils/sessionTaskbarProgress'

let lastSent = ''

function pushTaskbarProgress(progress: number, mode: string): void {
  const key = `${progress}|${mode}`
  if (key === lastSent) return
  lastSent = key
  void window.electronAPI?.setTaskbarProgress?.({ progress, mode })
}

/** Sync Electron taskbar/dock progress with the active session. */
export function syncTaskbarProgress(): void {
  const api = window.electronAPI?.setTaskbarProgress
  if (!api) return

  const session = useQuestSessionStore.getState().session
  if (session) {
    const state = computeQuestSessionTaskbarProgress(session)
    pushTaskbarProgress(state.progress, state.mode)
    return
  }

  const practice = useSkillPracticeStore.getState().session
  if (practice) {
    const state = computePracticeTaskbarProgress(practice.activeElapsedSec)
    pushTaskbarProgress(state.progress, state.mode)
    return
  }

  const hidden = taskbarProgressHidden()
  pushTaskbarProgress(hidden.progress, hidden.mode)
}

/** @internal Vitest only */
export function resetTaskbarProgressSyncForTests(): void {
  lastSent = ''
}
