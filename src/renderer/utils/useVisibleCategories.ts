import { useMemo } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { getVisibleCategories } from '@/utils/learningProfile'
import type { QuestCategory } from '@/data/skillTree'

export function useVisibleCategories(): QuestCategory[] {
  const profile = useUIStore((s) => s.settings.learningProfile)
  return useMemo(() => getVisibleCategories(profile), [profile])
}

export function useLearningProfile() {
  return useUIStore((s) => s.settings.learningProfile)
}
