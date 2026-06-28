import type { Language } from '@/i18n/languages'

export const DATE_LOCALE: Record<Language, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  zh: 'zh-CN',
  'zh-tw': 'zh-TW',
  ja: 'ja-JP',
  ko: 'ko-KR',
}

export function formatLocalizedDate(
  date: Date | string,
  lang: Language,
  options: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date.includes('T') ? date : `${date}T00:00:00`) : date
  return d.toLocaleDateString(DATE_LOCALE[lang], options)
}
