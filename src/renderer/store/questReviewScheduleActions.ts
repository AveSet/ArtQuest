import { useUIStore } from '@/store/useUIStore'

export function removeQuestReviewScheduleEntry(questId: number): void {
  const schedule = { ...useUIStore.getState().questReviewSchedule }
  delete schedule[String(questId)]
  useUIStore.setState({ questReviewSchedule: schedule })
}
