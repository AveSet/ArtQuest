import type { ProgressPayload } from '../../shared/progressSchema'
import { normalizeProgressPayload, CURRENT_PROGRESS_SCHEMA_VERSION } from '../../shared/progressSchema'
import type { QuestCompletionLog } from '@/store/models'
import {
  compressCompletionLogsForExport,
  expandPayloadCompletionLogs,
  shouldCompressCompletionLogsForExport,
} from '../../shared/progressLogCompression'

export type ExportEnvelope = {
  schemaVersion: number
  exportedAt: string
  payload: Record<string, unknown>
}

export function buildExportEnvelope(
  progressData: Record<string, unknown>,
  exportedAt = new Date().toISOString(),
): ExportEnvelope {
  const stripped = stripGalleryBinary(progressData, false)
  const logs = Array.isArray(stripped.questCompletionLogs)
    ? (stripped.questCompletionLogs as QuestCompletionLog[])
    : []
  let payload: Record<string, unknown> = stripped
  if (shouldCompressCompletionLogsForExport(logs)) {
    const { questCompletionLogs: _omit, ...rest } = stripped
    void _omit
    payload = {
      ...rest,
      questCompletionLogsCompressed: compressCompletionLogsForExport(logs),
      questCompletionLogs: [],
    }
  }
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    exportedAt,
    payload,
  }
}

export function stripGalleryBinary(
  progressData: Record<string, unknown>,
  includeMedia: boolean,
): Record<string, unknown> {
  if (includeMedia) return { ...progressData }
  const works = Array.isArray(progressData.completedWorks)
    ? (progressData.completedWorks as Record<string, unknown>[]).map((w) => ({
        ...w,
        imageUrl: typeof w.imageUrl === 'string' && w.imageUrl.startsWith('data:') ? '' : w.imageUrl,
      }))
    : []
  const settings =
    progressData.settings && typeof progressData.settings === 'object' && !Array.isArray(progressData.settings)
      ? {
          ...(progressData.settings as Record<string, unknown>),
          customAvatarDataUrl:
            typeof (progressData.settings as Record<string, unknown>).customAvatarDataUrl === 'string'
              ? ''
              : (progressData.settings as Record<string, unknown>).customAvatarDataUrl,
        }
      : progressData.settings
  return { ...progressData, completedWorks: works, settings }
}

export function parseImportEnvelope(raw: unknown): ProgressPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const payload = obj.payload && typeof obj.payload === 'object' ? obj.payload : obj
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return null
    }
  }
  try {
    return normalizeProgressPayload(expandPayloadCompletionLogs(record))
  } catch {
    return null
  }
}

export function downloadProgressJson(envelope: ExportEnvelope, filename?: string): void {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `artquest-progress-${envelope.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
