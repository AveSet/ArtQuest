export type AppLogLevel = 'info' | 'warn' | 'error'

/**
 * Structured, grep-friendly logs (DevTools / main console). PII-free by convention.
 */
export function appLog(level: AppLogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  const prefix = `[ArtQuest][${level.toUpperCase()}][${scope}] ${message}`
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  if (meta && Object.keys(meta).length > 0) {
    fn(prefix, meta)
  } else {
    fn(prefix)
  }
}
