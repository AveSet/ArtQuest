import type { LoadProgressResponse } from '../../shared/loadProgressResponse'
import { normalizeProgressPayloadResult, pickLoadedProgressFields } from '../../shared/progressSchema'
import { loadProgressFromBrowser } from './browserProgress'

const CORRUPT_BACKUP_KEY = 'artquest-progress-corrupt-backup'

export function backupCorruptProgressToBrowser(raw: Record<string, unknown>): void {
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, JSON.stringify(raw))
  } catch (err) {
    console.error('[progressLoad] corrupt backup failed:', err)
  }
}

export function readCorruptProgressBackupFromBrowser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(CORRUPT_BACKUP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export function loadProgressFromBrowserWithStatus(): LoadProgressResponse {
  const raw = loadProgressFromBrowser()
  if (!raw) return { status: 'empty' }

  const result = normalizeProgressPayloadResult(raw)
  if (result.ok) {
    return { status: 'ok', data: pickLoadedProgressFields(result.data) }
  }

  backupCorruptProgressToBrowser(raw)
  return {
    status: 'corrupt',
    message: result.errorMessage ?? result.reason,
  }
}
