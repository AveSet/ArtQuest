import { useCallback, useEffect, useState } from 'react'
import { useUIStore } from '@/store/useUIStore'

type Params = {
  today: string
  allDailyCompleted: boolean
  dailyBonusGrantedDate: string
}

/**
 * Coordinates chest + day-complete modals so they never stack.
 * Day-complete modal runs standalone when all dailies are finished.
 */
export function useDashboardOverlays({
  today,
  allDailyCompleted,
  dailyBonusGrantedDate,
}: Params) {
  const lastDailyRitualDate = useUIStore((s) => s.streakState.lastDailyRitualDate)

  const [dayCompleteOpen, setDayCompleteOpen] = useState(false)

  const openDayCompleteRitual = useCallback(() => {
    setDayCompleteOpen(true)
    useUIStore.getState().markDailyRitualShown(today)
  }, [today])

  const tryOpenDayCompleteRitual = useCallback(() => {
    if (lastDailyRitualDate === today) return
    if (!allDailyCompleted || dailyBonusGrantedDate !== today) return
    openDayCompleteRitual()
  }, [
    allDailyCompleted,
    dailyBonusGrantedDate,
    lastDailyRitualDate,
    openDayCompleteRitual,
    today,
  ])

  useEffect(() => {
    tryOpenDayCompleteRitual()
  }, [tryOpenDayCompleteRitual])

  return {
    dayCompleteOpen,
    setDayCompleteOpen,
  }
}
