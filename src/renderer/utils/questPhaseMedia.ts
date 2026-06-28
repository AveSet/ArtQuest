import type { QuestPhaseMediaEntry } from '@/store/models'

export type QuestPhaseMediaMap = Record<string, Record<string, QuestPhaseMediaEntry[]>>

export function newPhaseMediaId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeEntry(raw: QuestPhaseMediaEntry): QuestPhaseMediaEntry {
  return {
    ...raw,
    id: raw.id ?? newPhaseMediaId(),
  }
}

/** Accept legacy single-entry saves and normalize to arrays with stable ids. */
export function normalizeQuestPhaseMedia(
  raw: Record<string, Record<string, QuestPhaseMediaEntry | QuestPhaseMediaEntry[]>> | undefined | null,
): QuestPhaseMediaMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: QuestPhaseMediaMap = {}
  for (const [questKey, phases] of Object.entries(raw)) {
    if (!phases || typeof phases !== 'object') continue
    const phaseOut: Record<string, QuestPhaseMediaEntry[]> = {}
    for (const [phaseKey, value] of Object.entries(phases)) {
      const list = Array.isArray(value) ? value : [value]
      const normalized = list
        .filter((entry): entry is QuestPhaseMediaEntry => entry != null && typeof entry === 'object')
        .map(normalizeEntry)
      if (normalized.length > 0) phaseOut[phaseKey] = normalized
    }
    if (Object.keys(phaseOut).length > 0) out[questKey] = phaseOut
  }
  return out
}

export function getPhaseMediaEntries(
  map: QuestPhaseMediaMap,
  questId: number,
  phaseKey: string,
): QuestPhaseMediaEntry[] {
  return map[String(questId)]?.[phaseKey] ?? []
}
