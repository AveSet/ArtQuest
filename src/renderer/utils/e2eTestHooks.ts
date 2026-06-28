import { useUIStore } from '@/store/useUIStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { buildExportEnvelope } from '@/utils/progressExport'
import { generateShareCardPng, downloadShareCard } from '@/utils/shareCard'

declare global {
  interface Window {
    __E2E_TEST__?: boolean
    __e2eRecordAllDailiesComplete?: () => void
    __e2eBuildExportEnvelope?: () => ReturnType<typeof buildExportEnvelope>
    __e2eTryShareCardDownload?: () => Promise<{ ok: boolean; blobSize?: number; reason?: string }>
  }
}

/** Dev/E2E-only hooks — installed when seedProgress sets `window.__E2E_TEST__`. */
export function installE2eTestHooks(): void {
  if (!window.__E2E_TEST__) return

  window.__e2eRecordAllDailiesComplete = () => {
    usePortraitStore.getState().recordAllDailiesComplete(getLocalDateStr())
  }

  window.__e2eBuildExportEnvelope = () => {
    const progressData = useUIStore.getState().buildProgressData()
    return buildExportEnvelope(progressData)
  }

  window.__e2eTryShareCardDownload = async () => {
    const blob = await generateShareCardPng({
      questTitle: 'ArtQuest',
      streak: 3,
      rankLabel: 'Novice',
      language: 'en',
      playerLevel: 0,
      rankColor: '#9ca3af',
      chestProgress: 0,
    })
    if (!blob) return { ok: false, reason: 'no-blob' }
    const ok = await downloadShareCard(blob)
    return { ok, blobSize: blob.size }
  }
}
