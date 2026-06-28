import type { Language } from '@/i18n/translations'

/** Pick localized string from a multilingual record with EN fallback. */
export function getLocalizedRecord(
  record: Partial<Record<Language, string>> & { en: string },
  language: Language,
): string {
  return record[language] ?? record.en
}
