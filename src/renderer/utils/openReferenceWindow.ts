import type { MaterialVideoMode } from '@/utils/materialExternalCatalog'
import type { QuestCategory } from '@/data/skillTree'
import type { Language } from '@/i18n/translations'
import type { ReferenceSource } from '@/store/models'
import { useUIStore } from '@/store/useUIStore'

export type ReferenceWindowParams = {
  mode: MaterialVideoMode
  questId?: number
  nodeId?: string
  category?: QuestCategory | 'all'
  tags?: string[]
  lang?: Language
  source?: ReferenceSource
}

export function openReferenceWindow(params: ReferenceWindowParams): void {
  const source = params.source ?? useUIStore.getState().settings.preferredReferenceSource
  void window.electronAPI?.openReferenceWindow?.({ ...params, source })
}
