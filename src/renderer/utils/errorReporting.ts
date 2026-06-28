import { appLog } from './appLog'

const STORAGE_KEY = 'artquest_error_log'
const MAX_ENTRIES = 50

export type ClientErrorEntry = {
  at: string
  scope: string
  message: string
  stack?: string
  meta?: Record<string, unknown>
}

function readEntries(): ClientErrorEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ClientErrorEntry[]) : []
  } catch {
    return []
  }
}

function writeEntries(entries: ClientErrorEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    // Storage full or unavailable — ignore.
  }
}

export function getClientErrorLog(): ClientErrorEntry[] {
  return readEntries()
}

export function clearClientErrorLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function recordClientError(
  scope: string,
  message: string,
  options?: { stack?: string; meta?: Record<string, unknown> },
): void {
  const entry: ClientErrorEntry = {
    at: new Date().toISOString(),
    scope,
    message,
    stack: options?.stack,
    meta: options?.meta,
  }

  appLog('error', scope, message, {
    stack: options?.stack,
    ...options?.meta,
  })

  const next = [...readEntries(), entry].slice(-MAX_ENTRIES)
  writeEntries(next)
}

let initialized = false

export function initGlobalErrorHandlers(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('error', (event) => {
    recordClientError('window.onerror', event.message || 'Unknown error', {
      stack: event.error instanceof Error ? event.error.stack : undefined,
      meta: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection'
    recordClientError('unhandledrejection', message, {
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}

/** @internal Vitest only */
export function resetErrorReportingForTests(): void {
  initialized = false
  clearClientErrorLog()
}
