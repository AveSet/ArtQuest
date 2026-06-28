import { appLog } from '@/utils/appLog'

/** One-time thresholds so we do not log on every auto-save tick. */
let progressSizeLogTier = 0

export function logProgressPayloadFootprint(context: string, progressData: Record<string, unknown>): void {
  try {
    const n = JSON.stringify(progressData).length
    const nextTier =
      n >= 92 * 1024 * 1024 ? 4 : n >= 50 * 1024 * 1024 ? 3 : n >= 15 * 1024 * 1024 ? 2 : n >= 5 * 1024 * 1024 ? 1 : 0
    if (nextTier > progressSizeLogTier) {
      progressSizeLogTier = nextTier
      const mb = Math.round((n / (1024 * 1024)) * 100) / 100
      if (nextTier >= 4) {
        appLog('error', 'persistence', `progress JSON near save limit (${context})`, { approxChars: n, approxMb: mb })
      } else if (nextTier >= 2) {
        appLog('warn', 'persistence', `progress JSON very large (${context})`, { approxChars: n, approxMb: mb })
      } else {
        appLog('warn', 'persistence', `progress JSON large (${context})`, { approxChars: n, approxMb: mb })
      }
    }
  } catch (e) {
    appLog('error', 'persistence', 'progress JSON.stringify failed', { context, err: String(e) })
  }
}

/** @internal Vitest only */
export function resetProgressPayloadLogTierForTests(): void {
  progressSizeLogTier = 0
}
