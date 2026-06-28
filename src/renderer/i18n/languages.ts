/** Supported UI / content locale codes (BCP 47 base tags). */
export type Language = 'en' | 'ru' | 'zh' | 'zh-tw' | 'ja' | 'ko'

/** Multilingual user-facing string; CJK locales may be filled incrementally. */
export type LocalizedString = Partial<Record<Language, string>> & { en: string; ru: string }

export const LANGUAGES: readonly Language[] = ['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko'] as const

export const LANGUAGE_LABELS: Record<Language, { flag: string; native: string; english: string }> = {
  en: { flag: '🇬🇧', native: 'English', english: 'English' },
  ru: { flag: '🇷🇺', native: 'Русский', english: 'Russian' },
  zh: { flag: '🇨🇳', native: '简体中文', english: 'Chinese (Simplified)' },
  'zh-tw': { flag: '🇹🇼', native: '繁體中文', english: 'Chinese (Traditional)' },
  ja: { flag: '🇯🇵', native: '日本語', english: 'Japanese' },
  ko: { flag: '🇰🇷', native: '한국어', english: 'Korean' },
}

/** Google Translate API target codes. */
export const TRANSLATE_TARGET: Record<Exclude<Language, 'en'>, string> = {
  ru: 'ru',
  zh: 'zh-CN',
  'zh-tw': 'zh-TW',
  ja: 'ja',
  ko: 'ko',
}

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}
