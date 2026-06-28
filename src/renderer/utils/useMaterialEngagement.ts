import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'

export type MaterialEngagementStatus = 'viewed' | 'helpful' | 'applied'

/** Toggle material engagement chips (viewed / helpful / applied) with autosave via UI store. */
export function useMaterialEngagement() {
  const { materialEngagement, setSettings } = useUIStore(
    useShallow((s) => ({
      materialEngagement: s.settings.materialEngagement ?? {},
      setSettings: s.setSettings,
    })),
  )

  const setMaterialEngagement = useCallback(
    (videoId: string, status: MaterialEngagementStatus) => {
      const current = materialEngagement[videoId]
      const next = { ...materialEngagement }
      if (current === status) delete next[videoId]
      else next[videoId] = status
      setSettings({ materialEngagement: next })
    },
    [materialEngagement, setSettings],
  )

  return { materialEngagement, setMaterialEngagement }
}
