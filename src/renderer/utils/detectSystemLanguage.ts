import type { Language } from '@/i18n/languages'

/** Map OS / browser locale to a supported app language (first-run default). */
export function detectSystemLanguage(locales?: string | string[]): Language {
  const raw = locales ?? (typeof navigator !== 'undefined' ? navigator.language : 'en')
  const list = Array.isArray(raw) ? raw : [raw]
  for (const tag of list) {
    const lower = tag.toLowerCase()
    const base = lower.split(/[-_]/)[0]
    if (base === 'ru') return 'ru'
    if (
      lower.startsWith('zh-tw') ||
      lower.startsWith('zh-hant') ||
      lower === 'zh-hk' ||
      lower === 'zh-mo'
    ) {
      return 'zh-tw'
    }
    if (base === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) return 'zh'
    if (lower.startsWith('zh-')) return 'zh'
    if (base === 'ja') return 'ja'
    if (base === 'ko') return 'ko'
    if (base === 'en') return 'en'
  }
  return 'en'
}
