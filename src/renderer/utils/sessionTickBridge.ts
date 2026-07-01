import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { syncTaskbarProgress } from '@/utils/syncTaskbarProgress'

/** Tell Electron main process to pulse session ticks only while a session is active. */
export function syncSessionTickActive(): void {
  const questActive = useQuestSessionStore.getState().session != null
  const practiceActive = useSkillPracticeStore.getState().session != null
  void window.electronAPI?.session?.setTickActive?.(questActive || practiceActive)
  syncTaskbarProgress()
}
