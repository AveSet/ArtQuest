import { translations, type Language } from './translations'

export function fmt(template: string, params: Record<string, string | number>): string {
  let out = template
  for (const [key, value] of Object.entries(params)) {
    out = out.replaceAll(`{${key}}`, String(value))
  }
  return out
}

/** Dashboard strings for a locale (missing keys fall back to English). */
export function getDashboardCopy(lang: Language) {
  const en = translations.en.dashboard
  const cur = translations[lang]?.dashboard ?? en
  return { ...en, ...cur }
}
