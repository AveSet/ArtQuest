import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'

/** Ends practice without XP — for sessions under the minimum duration. */
export function cancelSkillPracticeSession(): void {
  useSkillPracticeStore.getState().clearSession()
}
