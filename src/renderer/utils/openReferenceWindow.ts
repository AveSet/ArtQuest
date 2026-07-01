import type { MaterialVideoMode } from '@/utils/materialExternalCatalog'
import type { QuestCategory } from '@/data/skillTree'
import type { Language } from '@/i18n/translations'
import type { ReferenceSource } from '@/store/models'
import { useUIStore } from '@/store/useUIStore'
import {
  isElectronDesktop,
  openReferenceWindowIpc,
  showTestNotificationIpc,
} from '@/utils/electronBridge'

export type ReferenceWindowParams = {
  mode?: MaterialVideoMode
  questId?: number
  nodeId?: string
  category?: QuestCategory | 'all'
  tags?: string[]
  lang?: Language
  source?: ReferenceSource
}

export function defaultModeForReferenceSource(source: ReferenceSource): MaterialVideoMode {
  switch (source) {
    case 'pinterest':
      return 'pinterest'
    case 'artstation':
      return 'sketchfab'
    case 'google':
      return 'long'
    case 'youtube':
    default:
      return 'long'
  }
}

function buildReferenceMaterialsHash(
  params: ReferenceWindowParams & { source: ReferenceSource; mode: MaterialVideoMode },
): string {
  const p = new URLSearchParams()
  p.set('mode', params.mode)
  p.set('source', params.source)
  if (params.questId != null) p.set('questId', String(params.questId))
  if (params.nodeId) p.set('node', params.nodeId)
  if (params.category) p.set('category', params.category)
  if (params.tags?.length) p.set('tags', params.tags.join(','))
  if (params.lang) p.set('lang', params.lang)
  return `#/reference-materials?${p.toString()}`
}

async function notifyReferenceWindowFailure(message: string): Promise<void> {
  console.error('[openReferenceWindow]', message)
  await showTestNotificationIpc({ title: 'ArtQuest', body: message })
}

export async function openReferenceWindow(params: ReferenceWindowParams): Promise<boolean> {
  const source: ReferenceSource =
    params.source ?? useUIStore.getState().settings.preferredReferenceSource ?? 'pinterest'
  const mode = params.mode ?? defaultModeForReferenceSource(source)
  const payload = { ...params, source, mode }

  if (isElectronDesktop()) {
    try {
      const result = await openReferenceWindowIpc(payload)
      if (result && !result.success) {
        await notifyReferenceWindowFailure(String(result.error ?? 'Could not open reference window'))
        return false
      }
      if (result?.success) return true
      await notifyReferenceWindowFailure('Reference window API is unavailable')
      return false
    } catch (err) {
      await notifyReferenceWindowFailure(String(err))
      return false
    }
  }

  window.location.hash = buildReferenceMaterialsHash(payload)
  return true
}
