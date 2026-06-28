import type { Language } from '@/i18n/languages'

/** Minimal localized record for tests (all locales share the same string). */
export function loc(text: string): Record<Language, string> {
  return { en: text, ru: text, zh: text, 'zh-tw': text, ja: text, ko: text }
}
