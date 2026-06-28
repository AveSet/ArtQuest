import type { QuestTitleOverrides } from '@/store/models'
import type { Language } from '@/i18n/translations'

const OVERRIDE_LANGUAGES: Language[] = ['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko']

export function normalizeQuestTitleOverrides(raw: unknown): QuestTitleOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: QuestTitleOverrides = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(key)
    if (!Number.isFinite(id) || !value || typeof value !== 'object' || Array.isArray(value)) continue
    const row = value as Record<string, unknown>
    const entry: Partial<Record<Language, string>> = {}
    for (const lang of OVERRIDE_LANGUAGES) {
      if (typeof row[lang] === 'string' && row[lang].trim()) entry[lang] = row[lang].trim()
    }
    if (Object.keys(entry).length > 0) out[id] = entry
  }
  return out
}

/** JSON keys are strings; persist overrides with stringified quest ids. */
export function serializeQuestTitleOverrides(overrides: QuestTitleOverrides): Record<string, Partial<Record<Language, string>>> {
  const out: Record<string, Partial<Record<Language, string>>> = {}
  for (const [id, row] of Object.entries(overrides)) {
    if (!row) continue
    const trimmed: Partial<Record<Language, string>> = {}
    for (const lang of OVERRIDE_LANGUAGES) {
      const value = row[lang]?.trim()
      if (value) trimmed[lang] = value
    }
    if (Object.keys(trimmed).length === 0) continue
    out[String(id)] = trimmed
  }
  return out
}
