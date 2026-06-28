import type { PersistedQuestSession } from '@/utils/sessionPersistence'

const SESSION_BUCKET_SEC = 30

/** Stable fingerprint so timer ticks do not rewrite progress every 2s. */
export function buildProgressSaveFingerprint(data: Record<string, unknown>): string {
  const normalized = { ...data }
  const session = normalized.activeQuestSession as PersistedQuestSession | null | undefined
  if (session && typeof session === 'object') {
    const { savedAtMs: _savedAtMs, ...rest } = session
    void _savedAtMs
    normalized.activeQuestSession = {
      ...rest,
      remainingSec:
        session.isRunning && !session.isExpired
          ? Math.floor(session.remainingSec / SESSION_BUCKET_SEC) * SESSION_BUCKET_SEC
          : session.remainingSec,
    }
  }
  return JSON.stringify(normalized)
}
